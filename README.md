# Ingenico Sample Ionic Application
This application is a demo application utilizing the [Cordova Plugin for Ingenico mPOS with Ionic](https://github.com/GiancarloGomez/cordova-plugin-ingenico)

## Installation
The following steps are required to run this application.
* Download the [plugin](https://github.com/GiancarloGomez/cordova-plugin-ingenico) to a directory on your machine so you may import into your application. I recommend that you download it to `plugins_src\cordova-plugin-ingenico` under the root of the project as this folder is not tracked.
* Follow instructions on plugin page in regards to downloading the mPOS SDK from Ingenico's developer portal as it is not included in the repo due to size limitations on GitHub.
* Create your environment file and enter your credentials for SDK initialization and API access which is provided by Ingenico.

Once you have all the necessary files run the following command at the root of your project
```bash
ionic cordova plugin add ./plugins_src/cordova-plugin-ingenico
```

## Environment File
Create the following JavaScript environment file :<br />
```
src/assets/javascript/config/environment.js
```

Enter your Ingenico API Credentials as follows :
```javascript
appSettings.ingenico.username  = "my-username";
appSettings.ingenico.password  = "my-password";
appSettings.ingenico.apiKey    = "my-api-key";
```

## The Sample Application
The sample application demos all available functions of the plugin. You will also see how to easily do the following:
* Subscribe to CustomEvents that are Dispatched for the plugin
* Control button state based on initialization, authentication and device ready status

## Debugging via Safari Web Developer Tools
Connect your device to your Mac via Safari's Web Developer Tools and use the
console to view log output as this will give you a lot of information.
