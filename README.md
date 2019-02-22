# Ingenico Test App

This application contains 3 sample views
* __HomePage__<br />
This page shows the Debit and Credit Transaction options utilizing the auto connect feature
* __ManualPage__<br />
This page shows the Debit, Cash and Credit Transaction options utilizing the Device selection feature
* __TerminalPage__<br />
This page shows the Debit and Credit Transaction options with a simple interface utilizing the auto connect feature

The page to show is configured within ``app.component.ts``

```javascript
rootPage : any = HomePage;
```
