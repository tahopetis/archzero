-- Revert relationships date columns back to DATE
ALTER TABLE relationships ALTER COLUMN valid_from TYPE DATE USING valid_from::DATE;
ALTER TABLE relationships ALTER COLUMN valid_to TYPE DATE USING valid_to::DATE;
