-- Allow invite codes between 4 and 20 characters (was fixed at 8)
alter table families drop constraint if exists families_invite_code_check;
alter table families add constraint families_invite_code_check
  check (char_length(invite_code) between 4 and 20);
