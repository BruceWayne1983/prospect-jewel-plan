UPDATE auth.users
SET encrypted_password = crypt('JuneMum43', gen_salt('bf')),
    updated_at = now()
WHERE email = 'emmalouisegregory@yahoo.com';