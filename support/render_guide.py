import json
import os
import string
import sys

USAGE_STR = 'python render_guide.py [template] [output] [standalone dir]'
NUM_ARGS = 3
DEFAULT_YEAR = 2050


def get_total_consumption(year, results_dir, region='global',
    policy='businessAsUsual'):

    if region == 'global':
        get_for_region = lambda x: get_total_consumption(
            year,
            results_dir,
            region=x,
            policy=policy
        )
        return sum([
            get_for_region('china'),
            get_for_region('eu30'),
            get_for_region('nafta'),
            get_for_region('row')
        ])
    
    if year == DEFAULT_YEAR:
        filename = policy + '.json'
    else:
        filename = '%s%d.json' % (policy, year)
    
    with open(os.path.join(results_dir, filename)) as f:
        results = json.load(f)
    
    return sum([
        results[region]['consumptionAgricultureMT'],
        results[region]['consumptionConstructionMT'],
        results[region]['consumptionElectronicMT'],
        results[region]['consumptionHouseholdLeisureSportsMT'],
        results[region]['consumptionPackagingMT'],
        results[region]['consumptionTransporationMT'],
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
        return sum([
            get_for_region('china'),
            get_for_region('eu30'),
            get_for_region('nafta'),
            get_for_region('row')
        ])
    
    if year == DEFAULT_YEAR:
        filename = policy + '.json'
    else:
        filename = '%s%d.json' % (policy, year)
    
    with open(os.path.join(results_dir, filename)) as f:
        results = json.load(f)
    
    return results[region][fate]


def get_percent_change(before, after):
    return (after - before) / before * 100


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        return
    
    template_loc = sys.argv[1]
    output_loc = sys.argv[2]
    results_dir = sys.argv[3]

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
    mismanaged_other = sum([
        get_fate(2050, results_dir, 'china'),
        get_fate(2050, results_dir, 'eu30'),
        get_fate(2050, results_dir, 'nafta')
    ])
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
    }

    with open(template_loc) as f:
        template_contents = string.Template(f.read())
    
    rendered = template_contents.safe_substitute(**template_vals)

    with open(output_loc, 'w') as f:
        f.write(rendered)


if __name__ == '__main__':
    main()
