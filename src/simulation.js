// src/simulation.js
var fs = require('fs');
var path = require('path');
var Papa = require('papaparse');

var official_retirement_age = 60;
var first_age_mortality_table = 25;
var inflation_rate = 0.03;
var actualization_rate = 0;
var revalorization_rate = 0;
var technical_rate_conversion_pension = 0; //Taux technique de conversion du capital en rente


function* range(start, end) {
	for (let i = start; i <= end; i++) {
		yield i;
	}
}

var dataset_mortalite_femmes = {};
var dataset_mortalite_hommes = {};

var l_femmes = {};
var l_hommes = {};

var L_femmes = {};
var L_hommes = {};

var e_femmes = {};
var e_hommes = {};


function array_to_object(starting_key,array) {

	var final_object = {};

	for (let i in [...range(0,array.length-1)]) {
		final_object[parseInt(i,10)+parseInt(starting_key,10)] = array[i]
	}

	return final_object;
}


//Fonction l(x)
function l_x(object) {

	var lx_object = {};

	for (let i in object) {
		lx_object[i] = {};
		if (i == 25) {
			for (let j in object[i]) {
				lx_object[i][j] = 1000000;
			}
		}
		else {
			for (let j in object[i]) {
				if (j == "Age") {
					lx_object[i][j] = object[i][j]
				} else {
					lx_object[i][j] = lx_object[i-1][j]*(1-object[i-1][j]/1)
				}
			}
		}

	}

	return lx_object;
}


//Fonction L(x)
function L_x(object) {

	var Lx_object = {};

	for (let i in object) {
		Lx_object[i] = {};
		for (let j in object[i]) {
			if (j == "Age") {
				Lx_object[i][j] = object[i][j]
			} 
			else if (object[+i+1] === undefined) {
				Lx_object[i][j] = object[i][j]/2;

			} 
			else {
				Lx_object[i][j] = (object[i][j] + object[+i+1][j])/2;
			}
		}
		
	}

	return Lx_object

}

//Fonction T(x)
function T_x(object) {

	var Tx_object = {};

	for (let i in object) {
		Tx_object[i] = {};
		for (let j in object[i]) {
			if (j == "Age") {
				Tx_object[i][j] = object[i][j]
			} 
			else {
				Tx_object[i][j] = 0;

				remaining_range = [...range(+i,Math.max.apply(Math,Object.keys(object)))];


				for (let k in remaining_range) {
					var l = remaining_range[k];
					Tx_object[i][j] += +object[l][j];
				}
				
			}
		}
		
	}

	return Tx_object

}

//Fonction e(x)
function e_x(T_object,l_object) {

	var ex_object = {};

	for (let i in T_object) {
		ex_object[i] = {};
		for (let j in T_object[i]) {
			if (j == "Age") {
				ex_object[i][j] = T_object[i][j]
			} 
			else {
				ex_object[i][j] = T_object[i][j]/l_object[i][j];
			}

		}
	}

	

	return ex_object

}


//Fonction pour obtenir le coefficient de conversion du capital en rente par AGE & ANNEE
function yearly_a_x(l_object,age,year) {
	var yearly_ax_object = 0; 

	var years_to_parse = [...range(age,Math.max.apply(Math,Object.keys(l_object)))];

	for (let i in years_to_parse) {
		
		var k = years_to_parse[i];

		if (l_object[+k+1] === undefined) {
			yearly_ax_object += 0;
		} else  {
			yearly_ax_object += (l_object[+k+1][year]/l_object[age][year])*Math.pow(((+revalorization_rate+1)/(+technical_rate_conversion_pension+1)),i)
		}
	}

	return yearly_ax_object
}


//Fonction pour obtenir le coefficient de conversion du capital en rente par ANNEE (renvoie un object avec les années en clés)
function a_x(l_object,age) {

	var ax_object = {};

	for (let year in l_object[age]) {
		if (year == 'Age') {} else {
			ax_object[year] = yearly_a_x(l_object,age,year);
		}
	}
	return ax_object
}


var table_mortalite_femmes_files = '';


fs.readFile('./data/table_mortalite_femmes.csv', 'utf8', (err, data) => {
	if (err) throw err;

	table_mortalite_femmes_files = data;

	Papa.parse(table_mortalite_femmes_files,
	{
		header:true,	
		complete: function(results, parse) {
			dataset_mortalite_femmes = array_to_object(first_age_mortality_table,results.data);
			l_femmes = l_x(dataset_mortalite_femmes);
			L_femmes = L_x(l_femmes);
			T_femmes = T_x(L_femmes);
			e_femmes = e_x(T_femmes,l_femmes);

		}
	});


});


function format_number(number) {
	let value = (Math.round(number).toLocaleString()).toString();
	let teste = value.replace(/,/g,' ');

	return teste
}

function format_percentage(number) {
	let value = ((number*100).toFixed(2)).toString()
	let teste = value.replace('.',',') + ' %';

	return teste
}



function simulator(dataset) {

	//Etablissement variables
	var retirement_age = dataset.retirement_age;
	var monthly_revenue = dataset.yearly_revenue/12;
	var min_contribution = dataset.min_contribution;
	var contribution_rate = dataset.contribution_rate/100;
	var additional_contribution = dataset.additional_contribution/1;
	var fee_on_contributions = dataset.fee_on_contributions/100;
	var working_age = dataset.working_age;
	var TMG_rate = dataset.TMG_rate/100;
	var wages_growth_rate = dataset.wages_growth_rate/100;
	var capital_withdrawal_rate = dataset.capital_withdrawal_rate/100;
	var simulation_year = dataset.simulation_year;
	var anticipated_retirement_abatement = dataset.anticipated_retirement_abatement/100;
	var fee_on_pensions = dataset.fee_on_pensions/100;
	var capital_reversion = dataset.capital_reversion/1;


	//Calculs

	if (monthly_revenue > min_contribution/12) {
		var monthly_contribution_basis = monthly_revenue - min_contribution/12;
	} else {
		var monthly_contribution_basis = 0;
	}
	var monthly_contribution = monthly_contribution_basis * contribution_rate;
	var net_monthly_revenue = monthly_revenue - monthly_contribution;
	var total_monthly_contribution = monthly_contribution + additional_contribution;
	var invested_contribution = total_monthly_contribution*(1-fee_on_contributions);
	var contribution_years = retirement_age - working_age;
	var contribution_months = contribution_years*12;
	var monthly_TMG_rate = Math.pow(1+TMG_rate,1/12) - 1;
	var monthly_wages_growth_rate = Math.pow(1+wages_growth_rate,1/12) - 1;
	var compounded_rate = (1+monthly_TMG_rate)*(1+monthly_wages_growth_rate);
	var accumulated_capital = invested_contribution/1 * 
	(1 - Math.pow(compounded_rate,contribution_months))
	/
	(1-compounded_rate)
	;

	var pension_capital = accumulated_capital*(1 - capital_withdrawal_rate );
	var expected_lifespan = e_femmes[retirement_age][simulation_year];
	var conversion_coefficient = a_x(l_femmes,retirement_age)[simulation_year];
	var capital_withdrawal = accumulated_capital*capital_withdrawal_rate;

	if (retirement_age >= official_retirement_age) {
		var life_annuity_without_reversion = pension_capital/(conversion_coefficient*12);
	} else 
	{
		var life_annuity_without_reversion = pension_capital/(conversion_coefficient*12) * (1- anticipated_retirement_abatement);
	}
	var monthly_pension_without_reversion = life_annuity_without_reversion * (1 - fee_on_pensions);
	var replacement_rate_without_reversion = monthly_pension_without_reversion*12/(monthly_contribution_basis*12*Math.pow(1+wages_growth_rate,contribution_years));

	if (retirement_age >= official_retirement_age) {
		var life_annuity_if_reversion = pension_capital/((conversion_coefficient + capital_reversion)*12);
	} else 
	{
		var life_annuity_if_reversion = pension_capital/((conversion_coefficient + capital_reversion)*12) * (1-anticipated_retirement_abatement);
	}
	var monthly_pension_if_reversion = life_annuity_if_reversion * (1 - fee_on_pensions);
	var replacement_rate_if_reversion = monthly_pension_if_reversion*12/(monthly_contribution_basis*12*Math.pow(1+wages_growth_rate,contribution_years));


	var result = {
		monthly_revenue:format_number(monthly_revenue),
		monthly_contribution_basis:format_number(monthly_contribution_basis),
		monthly_contribution:format_number(monthly_contribution),
		net_monthly_revenue:format_number(net_monthly_revenue),
		invested_contribution:format_number(invested_contribution),
		contribution_years:format_number(contribution_years),
		contribution_months:format_number(contribution_months),
		monthly_TMG_rate:format_percentage(monthly_TMG_rate),
		monthly_wages_growth_rate:format_percentage(monthly_wages_growth_rate),
		accumulated_capital:format_number(accumulated_capital),
		pension_capital:format_number(pension_capital),
		expected_lifespan:format_number(expected_lifespan),
		conversion_coefficient:format_number(conversion_coefficient),
		capital_withdrawal:format_number(capital_withdrawal),
		life_annuity_without_reversion:format_number(life_annuity_without_reversion),
		monthly_pension_without_reversion:format_number(monthly_pension_without_reversion),
		replacement_rate_without_reversion:format_percentage(replacement_rate_without_reversion),
		life_annuity_if_reversion:format_number(life_annuity_if_reversion),
		monthly_pension_if_reversion:format_number(monthly_pension_if_reversion),
		replacement_rate_if_reversion:format_percentage(replacement_rate_if_reversion)
	}

	return result
	;
}


module.exports = simulator;
