var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
 
require('dotenv').config();

var simulator = require('./src/simulation.js');


var app = express();
var basicAuth = require('express-basic-auth');



// view engine setup
app.set('views', path.join(__dirname, 'views'))

// .use(basicAuth({
// 	users: { 'simulateur': 'mdpsimulateur2019' },
//     challenge: true,
//     unauthorizedResponse: getUnauthorizedResponse
// }))

.set('view engine', 'ejs')

.use(morgan('combined'))

.use(express.urlencoded({ extended: false }))

.use(cookieParser())
.use(express.static(path.join(__dirname, 'public')))
.get('/outputs', function(req,res,next){ // exposed API to received submitted values
	var request = {
		retirement_age:req.query.retirement_age,
		yearly_revenue : req.query.yearly_revenue,
		min_contribution : req.query.min_contribution,
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
	
	var dataset = simulator(request); // Calculated output from submitted values

	res.render('output.ejs', {dataset:dataset}) // Returns the whole rendered block
})
.get('/',function(req,res,next) {
	res.sendFile(path.join(__dirname,'./public/index.html'))
})

function getUnauthorizedResponse(req) {
    return req.auth
        ? ('Contactez benjamin.roger@sapiowork.com pour obtenir le mot de passe')
        : "Aucune information n'a été saisie"
}


if (process.env.ENVIRONMENT === 'LOCAL') {
	module.exports = app;
} else {
	app.listen('8080')
} 