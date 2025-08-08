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
  - textbox "Name": Test Insurance Co
  - text: Phone
  - textbox "Phone"
  - text: Email
  - textbox "Email": test@insurance.com
  - text: Address
  - textbox "Address"
  - checkbox "Create workspace access"
  - text: Create workspace access
  - paragraph: Generate login credentials and create a dedicated workspace for this contact
  - button "Cancel"
  - button "Add Contact"
  - button "Close":
    - img
    - text: Close
```