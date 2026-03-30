-- Delete the old duplicate account
DELETE FROM auth.identities WHERE user_id = '7134ffdb-335a-482d-a5c2-488d96b85c1a';
DELETE FROM auth.sessions WHERE user_id = '7134ffdb-335a-482d-a5c2-488d96b85c1a';
DELETE FROM auth.refresh_tokens WHERE instance_id IN (SELECT instance_id FROM auth.users WHERE id = '7134ffdb-335a-482d-a5c2-488d96b85c1a');
DELETE FROM auth.mfa_factors WHERE user_id = '7134ffdb-335a-482d-a5c2-488d96b85c1a';
DELETE FROM auth.users WHERE id = '7134ffdb-335a-482d-a5c2-488d96b85c1a';
