import datetime
import json
import math
import os
import string
import sys

import const

USAGE_STR = 'python render_guide.py [template] [output] [standalone dir] [diagnostics]'
NUM_ARGS = 4
DEFAULT_YEAR = 2050
NEW_YORK_AREA = 59.1
EMPTY_BOTTLE_MASS = 0.000023
ML_TO_KM = 0.0000000000005  #500mL is 0.0000000000005 cubic km
MILES_PER_KM = 0.6213712


def get_total_consumption(year, results_dir, region='global',
    policy='businessAsUsual'):

    if region == 'global':
        get_for_region = lambda x: get_total_consumption(
            year,
            results_dir,
            region=x,
            policy=policy
        )
        return sum(map(get_for_region, const.REGIONS_NO_GLOBAL))
    
    if year == DEFAULT_YEAR:
        filename = policy + '.json'
    else:
        policy_effective = policy if year >= 2024 else 'businessAsUsual'
        filename = '%s%d.json' % (policy_effective, year)
    
    with open(os.path.join(results_dir, filename)) as f:
        results = json.load(f)
    
    return sum([
        results[region]['consumptionAgricultureMT'],
        results[region]['consumptionConstructionMT'],
        results[region]['consumptionElectronicMT'],
        results[region]['consumptionHouseholdLeisureSportsMT'],
        results[region]['consumptionPackagingMT'],
        results[region]['consumptionTransportationMT'],
        results[region]['consumptionTextileMT'],
        results[region]['consumptionOtherMT']
    ])


def get_fate(year, results_dir, region='global', policy='businessAsUsual',
    fate='eolMismanagedMT'):
    if region == 'global':
        get_for_region = lambda x: get_fate(
            year,
            results_dir,
            region=x,
            policy=policy,
            fate=fate
        )
        return sum(map(get_for_region, const.REGIONS_NO_GLOBAL))
    
    if year == DEFAULT_YEAR:
        filename = policy + '.json'
    else:
        policy_effective = policy if year >= 2024 else 'businessAsUsual'
        filename = '%s%d.json' % (policy_effective, year)
    
    with open(os.path.join(results_dir, filename)) as f:
        results = json.load(f)
    
    return results[region][fate]


def get_percent_change(before, after):
    return (after - before) / before * 100


def get_cone_height(mismanaged_waste_mmt):
    city_area = NEW_YORK_AREA
    cone_radius = math.sqrt(city_area / math.pi)
    mismanaged_mass = mismanaged_waste_mmt * 1000000
    number_bottles = (mismanaged_mass/EMPTY_BOTTLE_MASS)
    mismanaged_volume = number_bottles * ML_TO_KM
    cone_height = (3 * mismanaged_volume) / (math.pi * (cone_radius**2))
    return cone_height


def km_to_miles(km_valu):
    return MILES_PER_KM * km_valu


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        return
    
    template_loc = sys.argv[1]
    output_loc = sys.argv[2]
    results_dir = sys.argv[3]
    diagnostics_loc = sys.argv[4]

    total_consumption_2024 = get_total_consumption(2024, results_dir)
    total_consumption_2050 = get_total_consumption(2050, results_dir)
    total_consumption_change = get_percent_change(
        total_consumption_2024,
        total_consumption_2050
    )

    mismanaged_2024 = get_fate(2024, results_dir)
    mismanaged_2050 = get_fate(2050, results_dir)
    mismanaged_change = get_percent_change(mismanaged_2024, mismanaged_2050)

    mismanaged_row = get_fate(2050, results_dir, 'row')
    other_regions = filter(lambda x: x != 'row', const.REGIONS_NO_GLOBAL)
    mismanaged_other = sum(map(lambda x: get_fate(2050, results_dir, x), other_regions))
    mismanaged_row_ratio = mismanaged_row / mismanaged_other
    mismanaged_row_percent = mismanaged_row / mismanaged_2050 * 100
    
    mismanaged_prod_cap = get_fate(2050, results_dir, policy='capVirgin')
    prod_cap_percent = get_percent_change(mismanaged_2050, mismanaged_prod_cap)

    mismanaged_mrc = get_fate(2050, results_dir, policy='minimumRecycledContent')
    mrc_percent = get_percent_change(mismanaged_2050, mismanaged_mrc)

    mismanaged_mrr = get_fate(2050, results_dir, policy='minimumRecyclingRate')
    mrr_percent = get_percent_change(mismanaged_2050, mismanaged_mrr)

    mismanaged_ps = get_fate(2050, results_dir, policy='banPsPackaging')
    delta_ps = mismanaged_ps - mismanaged_2050

    mismanaged_single_use = get_fate(2050, results_dir, policy='banSingleUse')
    delta_single_use = mismanaged_single_use - mismanaged_2050

    high_ambition_total = get_total_consumption(2050, results_dir, policy='highAmbition')
    high_ambition_mismanaged = get_fate(2050, results_dir, policy='highAmbition')

    mismanaged_additives = get_fate(2050, results_dir, policy='reducedAdditives')
    delta_additives = mismanaged_additives - mismanaged_2050
    
    mismanaged_tax_virgin = get_fate(2050, results_dir, policy='taxVirgin')
    delta_tax_virgin = mismanaged_tax_virgin - mismanaged_2050

    mismanaged_ban_waste_trade = get_fate(2050, results_dir, policy='banWasteTrade')
    delta_ban_waste_trade = mismanaged_ban_waste_trade - mismanaged_2050

    bau_recycle = get_fate(2050, results_dir, fate='eolRecyclingMT')
    invest_recycle = get_fate(
        2050, 
        results_dir,
        fate='eolRecyclingMT',
        policy='recyclingInvestment'
    )
    invest_recycle_percent = get_percent_change(bau_recycle, invest_recycle)
    invest_recycle_mismanaged = get_fate(
        2050, 
        results_dir,
        policy='recyclingInvestment'
    )
    invest_recycle_mismanaged_percent = get_percent_change(
        mismanaged_2050,
        invest_recycle_mismanaged
    )

    invest_waste_mismanaged = get_fate(2050, results_dir, policy='wasteInvestment')
    invest_waste_percent = get_percent_change(mismanaged_2050, invest_waste_mismanaged)

    tower_bau_mass_annual = get_fate(2050, results_dir)
    tower_bau_km_annual = get_cone_height(tower_bau_mass_annual)
    tower_bau_miles_annual = km_to_miles(tower_bau_km_annual)

    tower_intervention_mass_annual = get_fate(2050, results_dir, policy='highAmbition')
    tower_intervention_km_annual = get_cone_height(tower_intervention_mass_annual)
    tower_intervention_miles_annual = km_to_miles(tower_intervention_km_annual)

    tower_intervention_low_mass_annual = get_fate(2050, results_dir, policy='lowAmbition')
    tower_intervention_low_km_annual = get_cone_height(tower_intervention_low_mass_annual)
    tower_intervention_low_miles_annual = km_to_miles(tower_intervention_low_km_annual)

    tower_bau_mass = sum(map(
        lambda year: get_fate(year, results_dir),
        range(2011, 2051)
    ))
    tower_bau_km = get_cone_height(tower_bau_mass)
    tower_bau_miles = km_to_miles(tower_bau_km)

    tower_intervention_mass = sum(map(
        lambda year: get_fate(year, results_dir, policy='highAmbition'),
        range(2011, 2051)
    ))
    tower_intervention_km = get_cone_height(tower_intervention_mass)
    tower_intervention_miles = km_to_miles(tower_intervention_km)

    tower_intervention_low_mass = sum(map(
        lambda year: get_fate(year, results_dir, policy='lowAmbition'),
        range(2011, 2051)
    ))
    tower_intervention_low_km = get_cone_height(tower_intervention_low_mass)
    tower_intervention_low_miles = km_to_miles(tower_intervention_low_km)
    
    with open(diagnostics_loc) as f:
        diagnostics = json.load(f)

    template_vals = {
        'totalConsumptionChange': round(total_consumption_change, ndigits=1),
        'totalConsumption2024': round(total_consumption_2024, ndigits=1),
        'totalConsumption2050': round(total_consumption_2050, ndigits=1),
        'mismanaged2024': round(mismanaged_2024, ndigits=1),
        'mismanaged2050': round(mismanaged_2050, ndigits=1),
        'mismanagedChange': round(mismanaged_change, ndigits=1),
        'mismanagedRowRatio': round(mismanaged_row_ratio, ndigits=1),
        'mismanagedRowPercent': round(mismanaged_row_percent, ndigits=1),
        'prodCapPercent': round(prod_cap_percent, ndigits=1),
        'mismanaged2050ProdCap': round(mismanaged_prod_cap, ndigits=1),
        'mismanaged2050Mrc': round(mismanaged_mrc, ndigits=1),
        'mrcPercent': round(mrc_percent, ndigits=1),
        'mrrPercent': round(mrr_percent, ndigits=1),
        'mismanaged2050Mrr': round(mismanaged_mrr, ndigits=1),
        'deltaPS': round(delta_ps, ndigits=1),
        'deltaSingleUse': round(delta_single_use, ndigits=1),
        'highAmbition2050Total': round(high_ambition_total, ndigits=1),
        'highAmbition2050Mismanaged': round(high_ambition_mismanaged, ndigits=1),
        'deltaAdditives': round(delta_additives, ndigits=1),
        'investRecycle': round(invest_recycle, ndigits=1),
        'bauRecycle': round(bau_recycle, ndigits=1),
        'investRecyclePercent': round(invest_recycle_percent, ndigits=1),
        'investRecycleMismanaged': round(invest_recycle_mismanaged, ndigits=1),
        'investRecyclePercentMismanaged': round(
            invest_recycle_mismanaged_percent,
            ndigits=1
        ),
        'investWastePercentMismanaged': round(invest_waste_percent, ndigits=1),
        'investWasteMismanaged': round(invest_waste_mismanaged, ndigits=1),
        'deltaTaxVirgin': round(delta_tax_virgin, ndigits=1),
        'towerInterventionMass': round(tower_intervention_mass),
        'towerInterventionMiles': round(tower_intervention_miles, ndigits=1),
        'towerInterventionKm': round(tower_intervention_km, ndigits=1),
        'towerInterventionMassAnnual': round(tower_intervention_mass_annual, ndigits=1),
        'towerInterventionMilesAnnual': round(tower_intervention_miles_annual, ndigits=2),
        'towerInterventionKmAnnual': round(tower_intervention_km_annual, ndigits=2),
        'towerInterventionLowMass': round(tower_intervention_low_mass),
        'towerInterventionLowMiles': round(tower_intervention_low_miles, ndigits=2),
        'towerInterventionLowKm': round(tower_intervention_low_km, ndigits=2),
        'towerInterventionLowMassAnnual': round(tower_intervention_low_mass_annual, ndigits=1),
        'towerInterventionLowMilesAnnual': round(tower_intervention_low_miles_annual, ndigits=2),
        'towerInterventionLowKmAnnual': round(tower_intervention_low_km_annual, ndigits=2),
        'towerBauMass': round(tower_bau_mass),
        'towerBauMiles': round(tower_bau_miles, ndigits=1),
        'towerBauKm': round(tower_bau_km, ndigits=1),
        'towerBauMassAnnual': round(tower_bau_mass_annual, ndigits=1),
        'towerBauMilesAnnual': round(tower_bau_miles_annual, ndigits=2),
        'towerBauKmAnnual': round(tower_bau_km_annual, ndigits=2),
        'deltaBanWasteTrade': round(delta_ban_waste_trade, ndigits=1),
        'epoch': round(datetime.datetime.now().timestamp()),
        'consumptionInSampleError': round(diagnostics['consumptionInSampleError'], ndigits=2),
        'consumptionOutSampleError': round(diagnostics['consumptionOutSampleError'], ndigits=2),
        'wasteInSampleError': round(diagnostics['wasteInSampleError'], ndigits=2),
        'wasteOutSampleError': round(diagnostics['wasteOutSampleError'], ndigits=2),
        'goodsTradeInSampleError': round(diagnostics['goodsTradeInSampleError'], ndigits=2),
        'goodsTradeOutSampleError': round(diagnostics['goodsTradeOutSampleError'], ndigits=2),
        'wasteTradeInSampleError': round(diagnostics['wasteTradeInSampleError'], ndigits=2),
        'wasteTradeOutSampleError': round(diagnostics['wasteTradeOutSampleError'], ndigits=2),
        'tradeSectorInSampleError': round(diagnostics['tradeSectorInSampleError'], ndigits=2),
        'tradeSectorOutSampleError': round(diagnostics['tradeSectorOutSampleError'], ndigits=2)
    }

    with open(template_loc) as f:
        template_contents = string.Template(f.read())
    
    rendered = template_contents.safe_substitute(**template_vals)

    with open(output_loc, 'w') as f:
        f.write(rendered)


if __name__ == '__main__':
    main()
