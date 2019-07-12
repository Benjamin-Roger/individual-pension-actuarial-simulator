var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');


var simulator = require('./src/simulation.js');


var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'))
.set('view engine', 'ejs')
.use(morgan('combined'))
.use(express.urlencoded({ extended: false }))
.use(cookieParser())
.use(express.static(path.join(__dirname, 'public')))
.get('/outputs', function(req,res,next){
	var request = {
	retirement_age:req.query.retirement_age,
	yearly_revenue : req.query.yearly_revenue,
	max_rate : req.query.max_rate,
	contribution_rate : req.query.contribution_rate,
	additional_contribution : req.query.additional_contribution,
	fee_on_contributions : req.query.fee_on_contributions,
	working_age : req.query.working_age,
	TMG_rate : req.query.TMG_rate,
	wages_growth_rate : req.query.wages_growth_rate,
	capital_withdrawal_rate : req.query.capital_withdrawal_rate,
	simulation_year : req.query.simulation_year,
	anticipated_retirement_abatement : req.query.anticipated_retirement_abatement,
	fee_on_pensions : req.query.fee_on_pensions,
	capital_reversion : req.query.capital_reversion,	
};
	
	var dataset = simulator(request);

	res.render('output.ejs', {dataset:dataset})
})

.use('/', function(req,res,next) {
	res.status(200)
  .sendFile(path.join(__dirname,'./public/index.html'))
})


// // error handler
// .use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {}

//   // render the error page
//   res.status(err.status || 500)
//   res.render('error')
// });

module.exports = app;