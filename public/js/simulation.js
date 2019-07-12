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


Papa.parse("/data/table_mortalite_femmes.csv",
{
	download:true,
	header:true,	
	complete: function(results, parse) {
		dataset_mortalite_femmes = array_to_object(first_age_mortality_table,results.data);
		l_femmes = l_x(dataset_mortalite_femmes);
		L_femmes = L_x(l_femmes);
		T_femmes = T_x(L_femmes);
		e_femmes = e_x(T_femmes,l_femmes);

		console.log(e_femmes)

	}
});

// Papa.parse("/data/table_mortalite_hommes.csv",
// {
// 	download:true,
// 	header:true,	
// 	complete: function(results, file) {
// 		dataset_mortalite_hommes = array_to_object(first_age_mortality_table,results.data);

// 		l_hommes = l_x(dataset_mortalite_hommes)
// 	}
// });


function main() {

	var retirement_age = $('#retirement_age').val();

	var monthly_revenue = $('#yearly_revenue').val()/12;

	var monthly_contribution_basis = monthly_revenue - $('#max_rate').val()/12/100;

	var monthly_contribution = monthly_contribution_basis * $('#contribution_rate').val()/100;

	var net_monthly_revenue = monthly_revenue - monthly_contribution;

	var additional_contribution = $('#additional_contribution').val()/1;

	var total_monthly_contribution = monthly_contribution + additional_contribution;

	var invested_contribution = total_monthly_contribution*(1-$('#fee_on_contributions').val()/100);

	var contribution_years = retirement_age - $('#working_age').val();

	var contribution_months = contribution_years*12;

	var monthly_TMG_rate = Math.pow(1+$('#TMG_rate').val()/100,1/12) - 1;

	var monthly_wages_growth_rate = Math.pow(1+$('#wages_growth_rate').val()/100,1/12) - 1;

	var compounded_rate = (1+monthly_TMG_rate)*(1+monthly_wages_growth_rate);

	var accumulated_capital = invested_contribution/1 * 
	(1 - Math.pow(compounded_rate,contribution_months))
	/
	(1-compounded_rate)
	;

	var pension_capital = accumulated_capital*(1 - $('#capital_withdrawal_rate').val()/100);

	var expected_lifespan = e_femmes[retirement_age][$('#simulation_year').val()];

	var conversion_coefficient = a_x(l_femmes,retirement_age)[$('#simulation_year').val()];

	var capital_withdrawal = accumulated_capital*$("#capital_withdrawal_rate").val()/100;

	if (retirement_age >= official_retirement_age) {
		var life_annuity_without_reversion = pension_capital/(conversion_coefficient*12);
	} else 
	{
		var life_annuity_without_reversion = pension_capital/(conversion_coefficient*12) * (1-$("#anticipated_retirement_abatement").val()/100);
	}

	var monthly_pension_without_reversion = life_annuity_without_reversion * (1 - $("#fee_on_pensions").val()/100);

	var replacement_rate_without_reversion = monthly_pension_without_reversion*12/(monthly_contribution_basis*12*Math.pow(1+$('#wages_growth_rate').val()/100,contribution_years));


	var capital_reversion = $('#capital_reversion').val()/1;

	if (retirement_age >= official_retirement_age) {
		var life_annuity_if_reversion = pension_capital/((conversion_coefficient + capital_reversion)*12);
	} else 
	{
		var life_annuity_if_reversion = pension_capital/((conversion_coefficient + capital_reversion)*12) * (1-$("#anticipated_retirement_abatement").val()/100);
	}

	var monthly_pension_if_reversion = life_annuity_if_reversion * (1 - $("#fee_on_pensions").val()/100);

	var replacement_rate_if_reversion = monthly_pension_if_reversion*12/(monthly_contribution_basis*12*Math.pow(1+$('#wages_growth_rate').val()/100,contribution_years));



	$('#monthly_revenue').html(Math.floor(monthly_revenue));
	$('#monthly_contribution_basis').html(Math.round(monthly_contribution_basis));
	$('#monthly_contribution').html(Math.round(monthly_contribution));
	$('#net_monthly_revenue').html(Math.round(net_monthly_revenue));
	$('#invested_contribution').html(Math.round(invested_contribution));
	$('#contribution_years').html(Math.round(contribution_years));
	$('#contribution_months').html(Math.round(contribution_months));
	$('#monthly_TMG_rate').html((monthly_TMG_rate*100).toFixed(2));
	$('#monthly_wages_growth_rate').html((monthly_wages_growth_rate*100).toFixed(2));
	$('#accumulated_capital').html(Math.round(accumulated_capital));
	$('#pension_capital').html(Math.round(pension_capital));
	$('#expected_lifespan').html(Math.round(expected_lifespan));
	$('#conversion_coefficient').html(Math.round(conversion_coefficient));
	$('#capital_withdrawal').html(Math.round(capital_withdrawal));
	$('#life_annuity_without_reversion').html(Math.round(life_annuity_without_reversion));
	$('#monthly_pension_without_reversion').html(Math.round(monthly_pension_without_reversion));	
	$('#replacement_rate_without_reversion').html((replacement_rate_without_reversion*100).toFixed(2));	
	$('#life_annuity_if_reversion').html(Math.round(life_annuity_if_reversion));
	$('#monthly_pension_if_reversion').html(Math.round(monthly_pension_if_reversion));	
	$('#replacement_rate_if_reversion').html((replacement_rate_if_reversion*100).toFixed(2));

}



$("#input_form").submit(function(e) {
	e.preventDefault();
	main();
});
