# TODO: Add Delete and Modify Buttons to Budget-Management Component

## Steps to Complete

- [x] Add "Actions" column to the budget table in budget-management.component.html with Edit and Delete buttons for each row.
- [x] Add properties in budget-management.component.ts: `isEditMode: boolean = false;` and `selectedBudgetId: number | null = null;`.
- [x] Add `editBudget(budget: any)` method to populate the form with selected budget data, set edit mode, and update button text.
- [x] Add `updateBudget()` method to call the update API, reload budgets, and reset form.
- [x] Add `deleteBudget(id: number)` method with confirmation to call delete API and reload budgets.
- [x] Modify `addBudget()` to handle both add and update based on `isEditMode`.
- [x] Update form button text in HTML to show "Modifier le budget" when in edit mode, otherwise "Ajouter le budget".
- [x] Ensure `resetForm()` resets edit mode and selected ID.
- [x] Test the functionality: add, edit, delete budgets.
