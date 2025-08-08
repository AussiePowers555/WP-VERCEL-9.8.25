# Page snapshot

```yaml
- dialog "Add New Contact":
  - heading "Add New Contact" [level=2]
  - paragraph: Add a new business or service provider to your contacts.
  - text: Contact Type
  - combobox "Contact Type": Insurer
  - text: Company
  - textbox "Company"
  - text: Name
  - textbox "Name": John Doe
  - text: Phone
  - textbox "Phone"
  - text: Email
  - textbox "Email"
  - text: Address
  - textbox "Address"
  - checkbox "Create workspace access" [disabled]
  - text: Create workspace access
  - paragraph: Email address required to create workspace access
  - button "Cancel"
  - button "Add Contact"
  - button "Close":
    - img
    - text: Close
```