.headers on
.mode csv
.output resin_trade_supplement.csv

SELECT
	year,
	region,
	(
		CASE
			WHEN netImportResinMT > 0 THEN netImportResinMT
			ELSE 0
		END
	) AS netImportResin,
	(
		CASE
			WHEN netImportResinMT < 0 THEN -1 * netImportResinMT
			ELSE 0
		END
	) AS netExportResin
FROM
	project_ml