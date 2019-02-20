import { Component, ViewChild } from '@angular/core';
import { ActionSheetController, LoadingController } from 'ionic-angular';
import { IngenicoProvider } from '../../providers/ingenico/ingenico';
import { Amount, Product, CreditSaleTransactionRequest, DebitSaleTransactionRequest } from '../../providers/providers';

@Component({
  selector: 'home-page',
  templateUrl: 'home.html'
})

export class HomePage {

  @ViewChild('orderForm') form;

  request: any;

  username: string    = "logicstudiotest1";
  password: string    = "logicstudio";
  currency: string    = "USD";
  quantity: string    = "1";
  subtotal: any       = 0;
  tax: any            = 0;
  total: any          = 0;
  discount: any       = 0;
  productID: number   = 0;
  productVal: any     = 0;
  productName: string = "";
  taxValue: any       = 0.07;

  logStyle:string     = "font-size:14px;font-family:'Operator Mono Ssm Light',Menlo,monospace";
  debug:boolean       = true;

  productInventory :Array<any> = [
    {id:0,name:"PRODUCT #1",price:1.00},
    {id:1,name:"PRODUCT #2",price:1.50},
    {id:2,name:"PRODUCT #3",price:2.00}
  ];

  deviceConnected:boolean = false;
  processingCharge:boolean = false;

  constructor(
    public ingenico: IngenicoProvider,
    public actionSheetCtrl: ActionSheetController,
    public loadingCtrl: LoadingController
  ) {
    if (this.debug) {console.log(`%chome.constructor()`,this.logStyle);}
    this.updateValues();
  }

  login(){
    if (this.debug) {console.log(`%chome.login()`,this.logStyle);}
    // for callback
    let debug = this.debug,
        logStyle = this.logStyle;
    // do login
    this.ingenico.login(this.username, this.password, "CAT6-64a80ac1-0ff3-4d32-ac92-5558a6870a88", "https://uatmcm.roamdata.com/", "0.1")
      .then(result => {
        if (this.debug) {console.log(`%chome.login()`,this.logStyle,result);}
        this.connect(function(result){
            if (debug) {console.log(`%chome.login()->connect()`,logStyle,result)};
        });
      }).catch(error => {
        alert("ERROR: " + error);
      });
  }

  connect(callback){
    if (this.debug) {console.log(`%chome.connect()`,this.logStyle);}
    // create and present loading notification
    let loading = this.loadingCtrl.create({
      content: 'Connecting device...'
    });
    loading.present();
    // do connect
    this.ingenico.connect().then(result => {
      if (this.debug) {console.log(`%chome.connect()->connect()`,this.logStyle);}
      loading.dismiss();
      // run callback - ask why?
      callback(result);
      this.deviceConnected = true;
      // why do we run this here?
      this.onDisconnect();
    }).catch(error => {
      loading.dismiss();
      callback(error);
    });
  }

  onDisconnect(){
    if (this.debug) {console.log(`%chome.onDisconnect()`,this.logStyle);}
    // fires off when device disconnects
    this.ingenico.onDeviceDisconnected().then(result => {
      if (this.debug) {console.log(`%chome.onDisconnect()->onDeviceDisconnected()`,this.logStyle);}
      this.deviceConnected = false;
    });
  }

  updateValues() {
    if (this.debug) {console.log(`%chome.updateValues()`,this.logStyle);}

    let quantity = parseInt(this.quantity),
        product  = this.productInventory[this.productID];

    this.subtotal = (product.price * quantity).toFixed(2);
    this.tax      = (product.price * this.taxValue * quantity).toFixed(2);
    this.total    = (product.price * ( this.taxValue + 1 ) * quantity).toFixed(2);
  }

  processCharge(type) {
    if (this.debug) {console.log(`%chome.processCharge(${type})`,this.logStyle);}
    let quantity = parseInt(this.quantity),
        product    = this.productInventory[this.productID],
        amount     = new Amount(this.currency, this.total*100, this.subtotal*100, this.tax*100, this.discount*100, "", 0),
        products   = new Array<Product>(
            // new Product(product.name,product.price, product.name, "", quantity)
        );

    this.processingCharge = true;

    if (type === 'credit'){
      this.request   = new CreditSaleTransactionRequest(amount, products, "", "", null);
      this.ingenico.processCreditSaleTransactionWithCardReader(this.request).then(result => {
        if (this.debug) {console.log(`%cCreditCardPurchaseResponse`,this.logStyle,result);}
        this.processingCharge = false;
      }).catch(error => {
        if (error !== "4945")
          alert("ERROR: " + error);
        this.processingCharge = false;
      });
    }
    else{
      this.request   = new DebitSaleTransactionRequest(amount, products, "", "", null);
      this.ingenico.processDebitSaleTransactionWithCardReader(this.request).then(result => {
        if (this.debug) {console.log(`%cDebitPurchaseResponse`,this.logStyle,result);}
        this.processingCharge = false;
      }).catch(error => {
        if (error !== "4945")
          alert("ERROR: " + error);
        this.processingCharge = false;
      });
    }
  }

  uploadSignature() {
    if (this.debug) {console.log(`%chome.uploadSignature()`,this.logStyle);}
    this.ingenico.getReferenceForTransactionWithPendingSignature().then(result => {
      if (result){
        this.ingenico.uploadSignature(result, "SG9sYSBtdW5kbw==").then(result => {
          alert(result);
        }).catch(error => {
          alert(error);
        });
      } else {
        alert("No transaction with pending signature.");
      }
    }).catch(error => {
      alert("No transaction with pending signature.");
    });
  }
}
