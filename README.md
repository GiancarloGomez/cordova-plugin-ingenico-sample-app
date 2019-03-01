# Ingenico Sample Application
This application contains 3 sample demos.

### Automatic Connection Demo
This demo uses the automatic connection feature. Once you hit connect the plugin will search for an available device and connect.

__Features__
* Credit Card Transaction
* Debit Card Transaction
* Upload Signature

### Manual Connection Demo
This demo uses the device search feature which will allow you to select an available device to connect to.

__Features__
* Cash Transaction
* Credit Card Transaction
* Debit Card Transaction

### Simple Terminal Demo
This demo uses the automatic connection feature and the interface is  a simple terminal like the Cash App.

__Features__
* Credit Card Transaction
* Debit Card Transaction

## Environment File
Create the following JavaScript environment file :<br />
```
src/assets/javascript/config/environment.js
```

Enter your Ingenico API Credentials as follows :
```
appSettings.ingenico.username  = "my-username";
appSettings.ingenico.password  = "my-password";
appSettings.ingenico.apiKey    = "my-api-key";
```


## Debugging via Safari Web Developer Tools 
Connect your device to your Mac via Safari's Web Developer Tools and use the
console to view log output as this will give you a lot of information.
