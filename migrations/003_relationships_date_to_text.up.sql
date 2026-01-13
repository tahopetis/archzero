-- Change relationships date columns to text to support ISO date strings
ALTER TABLE relationships ALTER COLUMN valid_from TYPE TEXT USING valid_from::TEXT;
ALTER TABLE relationships ALTER COLUMN valid_to TYPE TEXT USING valid_to::TEXT;
