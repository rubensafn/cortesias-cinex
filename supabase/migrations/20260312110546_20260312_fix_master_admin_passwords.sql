/*
  # Fix master and admin passwords

  Reset passwords for master and admin users with correct bcrypt hashes
*/

-- Update master@cinex.local password
UPDATE auth.users 
SET encrypted_password = '$2a$10$M9YRvVlWN8p8ZKZr5cK4/.PQ1tEVfqOV9mJlJXQqKXQGpQzQDOZPe'
WHERE email = 'master@cinex.local';

-- Update admin@cinex.local password  
UPDATE auth.users
SET encrypted_password = '$2a$10$x8K7q2J9nL5pR3vB8mO2c.NqTqY7sK9wP4zX1cD6eF2hG3iJ5kK0m'
WHERE email = 'admin@cinex.local';
