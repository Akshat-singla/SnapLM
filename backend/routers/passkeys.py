import os
from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
from utils.auth import get_current_user
from models.db_models import User, PasskeyCredential
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers.structs import (
    RegistrationCredential,
    AuthenticationCredential,
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    PublicKeyCredentialDescriptor,
    ResidentKeyRequirement,
)
from webauthn.helpers import bytes_to_base64url, base64url_to_bytes
from pydantic import BaseModel
import json

router = APIRouter(prefix="/api/v1/auth/passkeys", tags=["passkeys"])

RP_ID = os.environ.get("RP_ID", "localhost")
RP_NAME = "SnapLM"
ORIGIN = os.environ.get("ORIGIN", "http://localhost:5173")

# Simple in-memory cache for anonymous challenges (discoverable credentials)
# In production, use Redis or a DB table with expiry.
ANONYMOUS_CHALLENGES = {}


# Removed inline get_current_user since we imported it from utils.auth


@router.get("/register/generate")
async def generate_register_options(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Get all existing passkeys for this user
    result = await db.execute(select(PasskeyCredential).where(PasskeyCredential.user_id == current_user.user_id))
    existing_credentials = result.scalars().all()
    exclude_credentials = [PublicKeyCredentialDescriptor(id=base64url_to_bytes(cred.credential_id)) for cred in existing_credentials]

    options = generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=str(current_user.user_id).encode('utf-8'),
        user_name=current_user.email,
        user_display_name=current_user.username,
        exclude_credentials=exclude_credentials,
        authenticator_selection=AuthenticatorSelectionCriteria(
            user_verification=UserVerificationRequirement.PREFERRED,
            resident_key=ResidentKeyRequirement.PREFERRED,
        )
    )

    # Store challenge securely in DB for user
    current_user.webauthn_challenge = bytes_to_base64url(options.challenge)
    await db.commit()

    return json.loads(options_to_json(options))


@router.post("/register/verify")
async def verify_register_response(
    registration_response: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        challenge = current_user.webauthn_challenge
        if not challenge:
            raise HTTPException(status_code=400, detail="Challenge not found")
            
        verification = verify_registration_response(
            credential=registration_response,
            expected_challenge=base64url_to_bytes(challenge),
            expected_rp_id=RP_ID,
            expected_origin=ORIGIN,
        )

        # Remove the challenge
        current_user.webauthn_challenge = None

        # Store credentials
        new_passkey = PasskeyCredential(
            user_id=current_user.user_id,
            credential_id=bytes_to_base64url(verification.credential_id),
            public_key=bytes_to_base64url(verification.credential_public_key),
            sign_count=verification.sign_count
        )
        db.add(new_passkey)
        await db.commit()

        return {"success": True, "message": "Passkey registered successfully"}

    except Exception as e:
        print(f"Error verifying registration: {e}")
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/credentials")
async def list_credentials(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PasskeyCredential).where(PasskeyCredential.user_id == current_user.user_id))
    passkeys = result.scalars().all()
    return [
        {
            "id": str(cred.id),
            "credential_id": cred.credential_id,
            "created_at": cred.created_at,
            "name": cred.name or "Passkey"
        }
        for cred in passkeys
    ]


@router.delete("/credentials/{passkey_id}")
async def delete_credential(passkey_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PasskeyCredential).filter(
        PasskeyCredential.id == passkey_id, 
        PasskeyCredential.user_id == current_user.user_id
    ))
    passkey = result.scalar_one_or_none()
    if not passkey:
        raise HTTPException(status_code=404, detail="Passkey not found")
    
    await db.delete(passkey)
    await db.commit()
    return {"success": True}


class GenerateAuthReq(BaseModel):
    email: str | None = None

@router.post("/authenticate/generate")
async def generate_auth_options(req: GenerateAuthReq, db: AsyncSession = Depends(get_db)):
    allow_credentials = []
    if req.email:
        result = await db.execute(select(User).filter(User.email == req.email))
        user = result.scalar_one_or_none()
        if user:
            creds_result = await db.execute(select(PasskeyCredential).where(PasskeyCredential.user_id == user.user_id))
            passkeys = creds_result.scalars().all()
            allow_credentials = [PublicKeyCredentialDescriptor(id=base64url_to_bytes(cred.credential_id)) for cred in passkeys]
    
    options = generate_authentication_options(
        rp_id=RP_ID,
        allow_credentials=allow_credentials,
        user_verification=UserVerificationRequirement.PREFERRED
    )

    if req.email:
         # Still try to store if possible for the user who requested, if known
         result = await db.execute(select(User).filter(User.email == req.email))
         user = result.scalar_one_or_none()
         if user:
            user.webauthn_challenge = bytes_to_base64url(options.challenge)
            await db.commit()
    else:
        # Store in anonymous cache
        challenge_str = bytes_to_base64url(options.challenge)
        ANONYMOUS_CHALLENGES[challenge_str] = challenge_str # Just tracking valid ones
    
    return json.loads(options_to_json(options))


class VerifyAuthReq(BaseModel):
    email: str | None = None
    credential: dict

from utils.token import create_access_token

@router.post("/authenticate/verify")
async def verify_auth_response(req: VerifyAuthReq, db: AsyncSession = Depends(get_db)):
    user = None
    challenge = None
    
    # Try to get challenge from clientDataJSON if not provided by user email
    client_data_json_b64 = req.credential.get("response", {}).get("clientDataJSON")
    if client_data_json_b64:
        try:
            # Decode clientDataJSON to find the challenge sent by the client
            import base64
            # Add padding if needed for standard b64 if not using urlsafe
            client_data_json = base64.urlsafe_b64decode(client_data_json_b64 + "==")
            client_data = json.loads(client_data_json)
            challenge = client_data.get("challenge")
        except Exception as e:
            print(f"Failed to parse clientDataJSON: {e}")

    try:
        # 1. Identify User from response
        auth_cred_id = req.credential.get("id")
        
        # Search all credentials for this ID
        cred_result = await db.execute(select(PasskeyCredential).where(PasskeyCredential.credential_id == auth_cred_id))
        stored_cred = cred_result.scalar_one_or_none()
        
        if not stored_cred:
             raise HTTPException(status_code=400, detail="Passkey not recognized")
             
        # Load the user
        user_result = await db.execute(select(User).where(User.user_id == stored_cred.user_id))
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=400, detail="User belonging to passkey not found")
            
        # If we have a challenge from the user record, prefer it.
        # Otherwise use the one we extracted or from cache.
        final_challenge = user.webauthn_challenge or challenge
        
        # Fallback to anonymous cache if not on user
        if not final_challenge and ANONYMOUS_CHALLENGES:
             # If we still don't have it, we're in trouble for non-resident keys, 
             # but let's try the cache as a last resort.
             final_challenge = next(iter(ANONYMOUS_CHALLENGES.keys()))

        if not final_challenge:
             raise HTTPException(status_code=400, detail="Challenge not found or expired")

        # Handle local development origin flexibility (localhost vs 127.0.0.1)
        expected_origins = [ORIGIN]
        if "localhost" in ORIGIN:
            expected_origins.append(ORIGIN.replace("localhost", "127.0.0.1"))
        elif "127.0.0.1" in ORIGIN:
            expected_origins.append(ORIGIN.replace("127.0.0.1", "localhost"))

        # verify_authentication_response actually expects a single string or list?
        # The library version might vary, but standard is a string. 
        # We'll try to find the one that matches the credential origin if possible, or just try them.
        
        last_err = None
        for origin in expected_origins:
            try:
                verification = verify_authentication_response(
                    credential=req.credential,
                    expected_challenge=base64url_to_bytes(final_challenge),
                    expected_rp_id=RP_ID,
                    expected_origin=origin,
                    credential_public_key=base64url_to_bytes(stored_cred.public_key),
                    credential_current_sign_count=stored_cred.sign_count
                )
                
                # If we got here, verification succeeded!
                stored_cred.sign_count = verification.new_sign_count
                user.webauthn_challenge = None
                # Also clean from cache
                if final_challenge in ANONYMOUS_CHALLENGES:
                    del ANONYMOUS_CHALLENGES[final_challenge]
                    
                await db.commit()

                token = create_access_token(user.user_id)
                return {
                    "success": True, 
                    "token": token, 
                    "user": {"id": str(user.user_id), "email": user.email, "username": user.username}
                }
            except Exception as e:
                last_err = e
                continue
        
        # If we exhausted all origins
        raise last_err

    except Exception as e:
        print(f"Error during passkey verification: {e}")
        import traceback
        traceback.print_exc()
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
