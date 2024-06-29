"""Script to generate a simple set of line plots for the guide section.

License:
    BSD, see LICENSE.md
"""
import itertools
import json
import os
import pathlib
import sys
import sqlite3

import jinja2
import matplotlib.pyplot
import pandas

KG_CONVERTER = 907.1847
NUM_ARGS = 3
SHOW_CONSUMPTION = False
USAGE_STR = 'python line.py [database] [output png] [regions json]'


def hide_spines(ax):
    """Convienence function to hide the spines.
    
    Args:
        ax: The matplotlib axis in which to hide the spines.
    """
    ax.spines['top'].set_visible(False)
    ax.spines['left'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['bottom'].set_visible(False)


def plot_region_consumption(ax, attribute, source, colors):
    """Plot the consumption for a region.
    
    Args:
        ax: The matplotlib axes in which to add the plot.
        attribute: The column with the consumption data to plot.
        source: The frame from which data should be pulled.
        colors: Dictionary mapping region key to color.
    """
    for region in sorted(colors.keys()):
        view = source[source['year'] >= 2011]
        region_data = view[view['region'] == region]
        region_data_initial = region_data[region_data['year'] <= 2020]
        region_data_projected = region_data[region_data['year'] >= 2020]
        
        color = colors[region]

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
    """Main entry point to the script."""
    if len(sys.argv) != NUM_ARGS + 1:
        print(USAGE_STR)
        sys.exit(1)

    database_loc = sys.argv[1]
    output_loc = sys.argv[2]
    regions_loc = sys.argv[3]

    database = sqlite3.connect(database_loc)

    # This will include 2006 and earlier but not graphed.
    source = pandas.read_sql(
        '''
        SELECT
            year,
            region,
            totalConsumptionMT,
            totalConsumptionMT / populationMillions AS perCapitaTons,
            totalConsumptionMT / gdpSum AS perGdpTons,
            gdpSum,
            populationMillions
        FROM
            (
                SELECT
                    project_ml.region AS region,
                    project_ml.year AS year,
                    (
                        project_ml.consumptionAgricultureMT +
                        project_ml.consumptionConstructionMT +
                        project_ml.consumptionElectronicMT +
                        project_ml.consumptionHouseholdLeisureSportsMT +
                        project_ml.consumptionOtherMT +
                        project_ml.consumptionPackagingMT +
                        project_ml.consumptionTextileMT +
                        project_ml.consumptionTransportationMT
                    ) AS totalConsumptionMT,
                    project_ml.population AS populationMillions,
                    gdp.gdpSum AS gdpSum
                FROM
                    project_ml
                INNER JOIN
                    gdp
                ON
                    project_ml.region = gdp.region
                    AND project_ml.year = gdp.year
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

    cols = 3 if SHOW_CONSUMPTION else 2
    fig, ax = matplotlib.pyplot.subplots(nrows=1, ncols=cols)

    fig.set_size_inches(12, 4.26)
    fig.tight_layout(h_pad=5, w_pad=9)

    current_path = os.path.abspath(__file__)
    current_dir = os.path.dirname(current_path)
    font_path_str = os.path.join(
        current_dir,
        'fonts',
        'fonts',
        'ttf',
        'PublicSans-Regular.ttf'
    )
    font_path = pathlib.Path(font_path_str)

    with open(regions_loc) as f:
        regions_info = json.load(f)

    colors = dict(map(lambda x: (x['key'], x['color']), regions_info['regions']))

    plot_region_consumption(ax[0], 'totalConsumptionMT', source, colors)
    ax[0].set_title('Total Consumption', font=font_path, fontsize=10)
    ax[0].set_ylabel('Million Metric Tons', font=font_path, fontsize=8)

    legend_values = []
    for region in regions_info['regions']:
        legend_values.append(region['full'])
        legend_values.append(region['label'] + ' Projected')

    ax[0].legend(legend_values, prop=matplotlib.font_manager.FontProperties(
        fname=font_path_str,
        size=8
    ))

    plot_region_consumption(ax[1], 'perCapitaKg', source, colors)
    ax[1].set_title('Per-Capita Consumption', font=font_path, fontsize=10)
    ax[1].set_ylabel('Kg / Year', font=font_path, fontsize=8)

    if SHOW_CONSUMPTION:
        plot_region_consumption(ax[2], 'perGdpKg', source, colors)
        ax[2].set_title('Consumption / GDP (2010 USD PPP)', font=font_path, fontsize=10)
        ax[2].set_ylabel('Kg / USD', font=font_path, fontsize=8)
    
    tick_labels = [
        ax[0].get_xticklabels(),
        ax[0].get_yticklabels(),
        ax[1].get_xticklabels(),
        ax[1].get_yticklabels()
    ]
    for item in itertools.chain(*tick_labels):
        item.set_font(font_path)
        item.set_fontsize(8)

    fig.savefig(output_loc, bbox_inches = 'tight', dpi=300)


if __name__ == '__main__':
    main()
