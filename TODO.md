# TODO: Fix Issues from Console Log

## 1. Remove Unused CurrencyPipe Import
- [x] Edit front/src/app/Composante/daf/rapport-projet/rapport-projet.component.ts to remove CurrencyPipe from imports

## 2. Add Missing Logo Asset
- [ ] Create front/src/assets/ directory (run: mkdir front\src\assets)
- [ ] Add logo-entreprise.png to front/src/assets/
- [ ] Note: User needs to provide the actual logo image file

## 3. Fix 403 on rh-users Endpoint
- [x] Add isRhOrAdmin middleware in back/app/middleware/authJwt.js
- [x] Update back/app/routes/user.routes.js to use isRhOrAdmin instead of isAdmin for rh-users route

## 4. Restart Dev Servers
- [ ] Restart Angular dev server (ng serve)
- [ ] Restart backend server if needed

## 5. Fix Authorization Issue for DAF Dashboard
- [x] Add role check in DafDashboardComponent ngOnInit to prevent RH users from accessing DAF dashboard
- [x] Add role check in RhDashboardComponent ngOnInit for consistency
- [x] Add role check in AdminDashboardComponent ngOnInit for consistency
- [x] Users with wrong role are redirected to their appropriate dashboard

## 6. Test Changes
- [ ] Check console for warnings/errors
- [ ] Verify logo loads
- [ ] Verify rh delegation works
- [ ] Verify role-based access to dashboards
