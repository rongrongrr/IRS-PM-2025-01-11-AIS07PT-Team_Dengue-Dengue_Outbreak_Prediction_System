import pandas as pd

# List of CSVs
csv_files = [
    'daily_rainfall_2022.csv',
    'daily_rainfall_2023.csv',
    'daily_rainfall_2024.csv',
    'daily_rainfall_2025.csv'
]

# Initialize tracking
combined_df = pd.DataFrame()
expected_columns = None
total_rows_expected = 0

print("Starting CSV combination...\n")

for file in csv_files:
    df = pd.read_csv(file)
    row_count = df.shape[0]
    col_names = list(df.columns)

    print(f"{file}: {row_count} rows")

    # Check column consistency
    if expected_columns is None:
        expected_columns = col_names
    elif col_names != expected_columns:
        raise ValueError(f"Column mismatch in {file}.\nExpected: {expected_columns}\nFound: {col_names}")

    total_rows_expected += row_count
    combined_df = pd.concat([combined_df, df], axis=0)

# Final sanity check
combined_df.reset_index(drop=True, inplace=True)
total_rows_actual = combined_df.shape[0]

print("\nAll files read successfully.")
print(f"Expected total rows: {total_rows_expected}")
print(f"Combined DataFrame rows: {total_rows_actual}")

if total_rows_actual != total_rows_expected:
    raise ValueError("Row count mismatch after combining files!")

# Save combined result
combined_df.to_csv('overall_rainfall_data.csv', index=False)
print("\nSaved combined CSV to 'combined_rainfall_data.csv'")