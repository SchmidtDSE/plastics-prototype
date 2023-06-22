multiplier <- 1 + input.get('nafta', 'recycling_delta') / 100
new_percent <- original.get('nafta', 'eol_recycling_percent') * multiplier
output.set('nafta', 'eol_recycling_percent', new_percent) <- new_percent