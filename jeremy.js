const predef = require("./tools/predef");
const EMA = require("./tools/EMA");
const SMA = require("./tools/SMA");
const meta = require("./tools/meta");
const StdDev = require("./tools/StdDev");


class jeremyIndicator {
     
    
    
   log(i_string)
   {
       if (true)
        console.log("Index: " + this.index + " => "  + i_string);
   }
   
   logBreak()
   {
       if (true)
        console.log("<------------------------------>")
       
   }
   
   logBalance()
   {
       
        this.log("Balance: " + this.tradeProfit);
       
   }
    
   
   printTrade()
   {
       var str;
       str = "Buy " + (this.tradeDir > 0 ? "Long" : "Short");
       str += " Price: " + this.tradePrice;
       str += " Size: " + this.tradeSize;
       return str;
   }
    
   init() {
        const triPeriod = Math.ceil((this.props.period + 1) / 2);
        this.ema = EMA(this.props.period);
        this.sma = SMA(triPeriod);
        this.smoothSMA = SMA(triPeriod);
        
        this.smoothDiff = SMA(3);
        this.smoothDiff2 = SMA(3);
        this.stdDev = StdDev(this.props.period * 2 );
        
       // this.prevSma = SMA(triPeriod);
      //  this.prevSsmoothSMA = SMA(triPeriod);
        
        
        this.profit = 0.0;
       
        this.index = 0;
         
        this.tradeEnabled = false;
        
        this.trade = false;
        this.tradeSell = false;
        this.tradeBuy = false;
        this.tradeDir = 0; 
        this.tradePrice = 0.0;
        this.tradeSize = 0;
        this.tradeProfit = 0;
        this.tradeSignal = 0;
        this.tradeIndex = 0;
 
        this.lastDiff = undefined;
        this.lastEma = 0.0;
        this.lastTri = 0.0
        this.lastDiffSig = 0.0;
        
        
        var today = new Date();
        
        this.tradeDayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 30, 0, 0);
        this.tradeDayStop = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 30, 0, 0);
        
        
        
         

    }
       
     
      //  const priorC = prior.close();
     //   const priorH = prior.high();
      //  const priorL = prior.low();
 
    map(d, i, history) {
        
        
        var triValue = 0.0;
        var emaValue = 0.0;
        var stdValue = 0.0;
        
        this.index = i;
        
        
        triValue =  this.smoothSMA(this.sma(d.value()));
        emaValue =  this.ema(d.value());
        stdValue =  this.stdDev(d.value());
        // if (stdValue > 2)
        //    stdValue = 2 + (stdValue - 2) * 0.25;
            
        if (stdValue < 2.0)
            stdValue = 4.0;
        else
            stdValue = Math.floor(stdValue);
        
        
        
       
        
        
        //stdValue =  stdValue < 1.25 ? 0 : stdValue;
        var diffValue = emaValue - triValue;
        
        var diffEma = (emaValue - this.lastEma);
        var diffTri = (triValue - this.lastTri);
        var diffSig = this.smoothDiff((diffEma + diffTri) * 1);
        
        var deltaSig = diffSig - this.lastDiffSig;
    
        
       //initi trading
       if (this.tradeEnabled == false )
       {
           if (this.lastDiff > 0.0 && diffValue < 0.0)
                this.tradeEnabled = true;
            if (this.lastDiff < 0.0 && diffValue > 0.0)
                this.tradeEnabled = true;
       } 
   
       
        if (this.tradeEnabled && d.date > this.tradeDayStart )//&& d.date < this.tradeDayStop)
        { 
            diffEma = emaValue - this.lastEma;
            diffTri = triValue - this.lastTri;
            
            //no current trade
            if (this.trade == false)
            {
                if (this.lastDiff > 0.0 && diffValue < 0.0 && i > this.tradeIndex)
                {
                    this.tradeSell = true;
                    this.tradeBuy = false;
                }
                    
                    
                if (this.tradeSell && stdValue > 1.0 && diffValue < 0.0 && diffSig < 0.0)
                { 
                    this.trade = true;
                    this.tradeSell = false;
                    this.tradeDir = -1.0;
                    this.tradeSize = stdValue;
                    this.tradeSignal = -stdValue;
                    this.tradePrice = d.value();
                    this.tradeIndex = i;
                    this.tradeProfit += -1.5;
                    
                    this.logBreak();
                    this.log(this.printTrade());
                    this.logBalance();
                    
                   
                   
                 
                }
                
    
                if (this.lastDiff < 0.0 && diffValue > 0.0 && i > this.tradeIndex)
                {
                    this.tradeSell = false;
                    this.tradeBuy = true;
                } 
                
                if (this.tradeBuy  && stdValue > 1.0 && diffValue > 0.0 && diffSig > 0.0)
                {
                    this.trade = true;
                    this.tradeBuy = false;
                    this.tradeDir = 1.0;
                    this.tradeSize = stdValue;
                    this.tradeSignal = stdValue;
                    this.tradeIndex = i;
                    this.tradePrice = d.value();
                    this.tradeProfit += -1.5;
                     
                    this.logBreak();
                    this.log(this.printTrade());
                    this.logBalance();
                  
                    
                    
                   // this.log("Index: " + i + " Buy Long @ " + this.tradePrice + " Size: " + stdValue);
                }
                
            }
            else
            {
                var diff;
                if (this.tradeDir > 0 )
                {
                    //profit
                    if (this.trade && d.high() > this.tradePrice + this.tradeSize && deltaSig < 0.0)
                    {
                        this.trade = false;
                        this.tradeSignal = 0;
                        
                        diff = (d.high() -  this.tradePrice ) * 5.0;
                        this.tradeProfit += diff;
                        
    
                        this.log("Sell Long Profit @ " + d.high() + " Profit: " + diff);
                        this.logBalance();
 
                    }
                     
                    //loss
                    if (this.trade && d.low() < this.tradePrice - this.tradeSize )
                    {
                        this.trade = false;
                        this.tradeSignal = 0;
                        diff = this.tradeSize * 5.0;
                        this.tradeProfit -= diff
                        
                        this.log("Sell Long Loss @ " + d.low() + " Loss: " + diff);
                        this.logBalance();
 
                       // this.log("Index: " + i + " Sell Long Loss  Balance: " + this.tradeProfit + " Price: " + this.tradePrice + " Size: " + this.tradeSize + " Current: " + d.low());

                    }
                }
                
                if (this.tradeDir < 0 )
                {
                    //profit
                    if (this.trade && d.low() < this.tradePrice - this.tradeSize && deltaSig > 0.0)
                    {
                        this.trade = false;
                        this.tradeSignal = 0;
                        diff =  (this.tradePrice -  d.low() ) * 5.0;
                        this.tradeProfit += diff;
                        
                        this.log("Sell Short Profit @ " + d.low() + " Profit: " + diff);
                        this.logBalance();
                        
                        //this.log("Index: " + i + " Sell Short Profit:  Price: " + this.tradePrice + " Size: " + this.tradeSize + " Current: " + d.low());
                    }
                     
                    //loss
                    if (this.trade && d.high() > this.tradePrice + this.tradeSize )
                    {
                        this.trade = false;
                        this.tradeSignal = 0;
                        diff = this.tradeSize * 5.0;
                        this.tradeProfit -= diff;
                        
                        this.log("Sell Short Loss @ " + d.high() + " Loss: " + diff);
                        this.logBalance();
                          
                       
                       //this.log( "Index: " + i + " Sell Short Loss:  Price: " + this.tradePrice + " Size: " + this.tradeSize + " Current: " + d.high());
                    }
                }
            }
        }
        
         
      
            
       // if (Math.abs(diffValue) > 0.1)    
        this.lastDiff = diffValue;
        this.lastEma = emaValue;
        this.lastTri = triValue;
        this.lastDiffSig = diffSig;
        
        return {
            zero: 0.0, //d.high(),
            high: diffSig,//this.smoothDiff(diffEma),
            ttt: this.tradeSignal, //diffTri * 5,
            v: diffValue,
            swing: stdValue,
            profit: this.tradeProfit/10.0
        };
            
            
    } 
     
        
     

    filter(_, i) {
        return i >= this.props.period;
    }
}

module.exports = {
    name: "jeremy",
    title: "Jeremy Indicator",
    description: "Jeremy Indicator",
    calculator: jeremyIndicator,
    params: {
        period: predef.paramSpecs.period(14)
    }, 
    

    inputType: meta.InputType.BARS,
      
    
    tags: [predef.tags.MovingAverage],
    
    plots: {
        zero: {  displayOnly: true  },
         high: {  displayOnly: true  },
          ttt: {  displayOnly: true  },
        v: {  title: "Signal" },
        swing: { displayOnly: true },
        profit: {  displayOnly: false }
    },   
 
    areaChoice: meta.AreaChoice.NEW,
    schemeStyles: {
        dark: {
           
            v: predef.styles.plot({
                color: "#cc6600",
                lineStyle: 1
            }),
            
             high: predef.styles.plot({
                color: "#cc9900",
                lineStyle: 1
            }),
            

            swing: predef.styles.plot({
                color: "#ff00ff",
                lineStyle: 3
            }),
            
 
             
            
             profit: predef.styles.plot("#00ff00"),
             
            
             ttt: predef.styles.plot({
                color: "#dddddd"
            }),
            zero: predef.styles.plot({
                color: "#cc0000",
                lineStyle: 3
            })
        }
    }
};


