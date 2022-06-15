const express = require('express');
const app = express();
const paypal =require('paypal-rest-sdk');
const braintree = require('braintree');



paypal.configure({
        'mode':'sandbox',
        'client_id': "AaNg6AKySjSMDbfZU6MyJ9U_wOchdYa5tYeMG6AiscwPpVbBSyG7hBtFWDVU24q7B9BeFBJhrSe8KyqV",
        'client_secret': "EFfkx-7ZwgsHhzR6IJ-YQiuXuqLf2LihygRJjDvpDgInBH_MQSTLNkMavjwa_LeYP2LQGgBGZ-9gPgZv"
    })
    
    
    
app.post('/payment', (req, res)=>{
        try{
            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method" : "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3030/success",
                    "cancel_url": "http://localhost:3030/cancel"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "rolex",
                            "price": "5.00",
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency" : "USD",
                        "total"    : "5.00"
                    },
                  }]
            };
   
            
paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
       throw error
                   // return res.json(error.message)
                } else {
                    for(let i = 0;i < payment.links.length;i++){
                      if(payment.links[i].rel === 'approval_url'){
                        res.redirect(payment.links[i].href);
                      }
                    }
                }
              });
            
    
        }catch(err){
            console.log(err.message)
            res.json({'err':err.message})
        }
    })
    
app.get('/success', (req, res) => {
        const payerId = req.query.PayerID;
        const paymentId = req.query.paymentId;
       
        const pay= {
          "payer_id": payerId,
          "transactions": [{
              "amount": {
                  "currency": "USD",
                  "total": "5.00"
              }
          }]
        };
       

paypal.payment.execute(paymentId, pay, function (err, payment) {
          if (err) {
              console.log(err.response);
              throw error;
          } else {
              console.log(JSON.stringify(payment));
              res.send('Success');
          }
      });
      });
    

    
app.get('/cancel', (req, res) =>{
         res.send('Cancelled')});  
    
    
app.get('/', (req, res)=>{
        res.send(`<h2>Pay<h2>
        <form action="/payment" method="post">
        <input type="submit" value="Buy">
      </form>`)
        
    })






const config = {
    environment:braintree.Environment.Sandbox,
    merchantId:'nymd7nkr7tsng5sv',
    publicKey: 'dymtjygwyyy6qg9b',
    privateKey: 'b28bff96d38e60f99caea06516b0c069'
    
};


const gateway = new braintree.BraintreeGateway(config)

app.get('/tokenGenerate', async(req, res)=>{
    try {
        gateway.clientToken.generate({}, (err, resdata)=>{
          if(err){
              return res.send({'error':err})
          }else{
              console.log(resdata)
              return res.json({'ststus':'success', 'message':resdata.clientToken})
          }
        })
        
    } catch (error) {
        return res.json({'status':'failed', 'message':error.message})
    }
})




app.post('/transaction', async(req, res)=>{
     try {
         const paymentDetail = gateway.transaction.sale({
             amount: req.body.amount,
             paymentMethodNonce: req.body.paymentMethodNonce,
             deviceData: req.body.deviceData,
             options: {
                 submitForSettlement: true
             }
         },(err, resData)=>{
             if(resData.success){
                 return res.json({'status':'success', 'message':resData.transaction})
                
             }else{
                return res.send({err:err})
             }
        })
    } catch (error) {
         return res.json({'status':'failed', 'message':error.message})
         
     }
})



app.post('/refund', async(req, res)=>{
    try {
        const paymentDetails = gateway.transaction.submitForPartialSettlement(
            'transaction_id',
            'cancellation_fees',
            (err, resData)=>{
                if(resData.success){
                    return res.json({'status':'success', 'message':resData.transaction})
                }else{
                    return res.send({err:err})
                }
            }
        )

    } catch (error) {
        return res.json({'status':'failed', 'message':error.message})
        
    }
})



app.listen(3030, ()=>{
    console.log("Started...")
})

//http://localhost:3030