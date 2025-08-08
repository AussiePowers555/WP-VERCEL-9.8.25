# Page snapshot

```yaml
- img
- text: Set Your Password Welcome! Please set a new password for your account to continue. New Password
- textbox "New Password"
- paragraph: Must be at least 8 characters with uppercase, lowercase, and number/special character
- text: Confirm Password
- textbox "Confirm Password"
- button "Set Password"
- heading "Password Requirements:" [level=3]
- list:
  - listitem: • At least 8 characters long
  - listitem: • Contains at least one uppercase letter (A-Z)
  - listitem: • Contains at least one lowercase letter (a-z)
  - listitem: • Contains at least one number or special character
- region "Notifications (F8)":
  - list
- alert
- button "Open Next.js Dev Tools":
  - img
```