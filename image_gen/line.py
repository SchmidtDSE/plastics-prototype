import sys
import sqlite3

import matplotlib.pyplot
import pandas

KG_CONVERTER = 907.1847
NUM_ARGS = 2
USAGE_STR = 'python line.py [database] [output png]'


def hide_spines(ax):
    ax.spines['top'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_visible(False)


def plot_region_consumption(ax, attribute, source):
    for region in ['china', 'eu30', 'nafta', 'row']:
        view = source[source['year'] >= 2010]
        region_data = view[view['region'] == region]
        region_data_initial = region_data[region_data['year'] <= 2020]
        region_data_projected = region_data[region_data['year'] >= 2020]
        
        color = {
            'china': '#a6cee3',
            'eu30': '#1f78b4',
            'nafta': '#b2df8a',
            'row': '#33a02c'
        }[region]

        ax.plot(
            region_data_initial['year'],
            region_data_initial[attribute],
            color=color
        )
        ax.plot(
            region_data_projected['year'],
            region_data_projected[attribute],
            color=color,
            linestyle='dashed'
        )
        
        ax.grid(color='#E5E5E5', axis='y', visible=True)
    
    ax.set_xlabel('Year')

    hide_spines(ax)


def main():
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        sys.exit(1)

    database_loc = sys.argv[1]
    output_loc = sys.argv[2]

    database = sqlite3.connect(database_loc)

    source = pandas.read_sql(
        '''
        SELECT
            year,
            region,
            totalConsumptionMT,
            totalConsumptionMT / populationMillions AS perCapitaTons,
            totalConsumptionMT / gdp AS perGdpTons,
            gdpSum,
            populationMillions
        FROM
            (
                SELECT
                    region AS region,
                    year AS year,
                    (
                        consumptionAgricultureMT +
                        consumptionConstructionMT +
                        consumptionElectronicMT +
                        consumptionHouseholdLeisureSportsMT +
                        consumptionOtherMT +
                        consumptionPackagingMT +
                        consumptionTextileMT +
                        consumptionTransporationMT
                    ) AS totalConsumptionMT,
                    population AS populationMillions,
                    gdp
                FROM
                    project_ml
            )
        ''',
        database
    )

    source['perCapitaKg'] = source['perCapitaTons'].apply(
        lambda x: x * KG_CONVERTER
    )
    source['perGdpKg'] = source['perGdpTons'].apply(
        lambda x: x * KG_CONVERTER
    )


    fig, ax = matplotlib.pyplot.subplots(nrows=1, ncols=3)



    fig.set_size_inches(14, 5)
    fig.tight_layout(h_pad=5, w_pad=9)

    plot_region_consumption(ax[0], 'totalConsumptionMT', source)
    ax[0].set_title('Total Consumption')
    ax[0].set_ylabel('Million Metric Tons')
    ax[0].legend([
        'China',
        'China Projected',
        'European Union',
        'EU Projected',
        'NAFTA',
        'NAFTA Projected',
        'Rest of World',
        'ROW Projected'
    ])

    plot_region_consumption(ax[1], 'perCapitaKg', source)
    ax[1].set_title('Per-Capita Consumption')
    ax[1].set_ylabel('Kg / Year')

    plot_region_consumption(ax[2], 'perGdpKg', source)
    ax[2].set_title('Consumption / GDP')
    ax[2].set_ylabel('Kg / USD')

    fig.savefig(output_loc, bbox_inches = 'tight')


if __name__ == '__main__':
    main()
