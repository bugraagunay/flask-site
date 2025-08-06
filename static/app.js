document.addEventListener('DOMContentLoaded', () => {
    const countryList = document.getElementById('country-list');
    const datasetSelect = document.getElementById('dataset');
    const yearList = document.getElementById('year-list');
    const filterForm = document.getElementById('filter-form');
    const tableBody = document.getElementById('table-body');
    const errorContainer = document.getElementById('error-container');

    // Fetch initial filter data
    fetch('/filters')
        .then(response => response.json())
        .then(data => {
            // Populate country checkbox list
            data.countries.forEach(country => {
                const item = document.createElement('div');
                item.className = 'form-check';
                item.innerHTML = `<input class="form-check-input" type="checkbox" value="${country}" id="country-${country}">
                                  <label class="form-check-label" for="country-${country}">${country}</label>`;
                countryList.appendChild(item);
            });

            // Populate dataset dropdown
            data.datasets.forEach(dataset => {
                const option = document.createElement('option');
                option.value = dataset;
                option.textContent = dataset;
                datasetSelect.appendChild(option);
            });

            // Populate year checkbox list
            data.years.forEach(year => {
                const item = document.createElement('div');
                item.className = 'form-check';
                item.innerHTML = `<input class="form-check-input" type="checkbox" value="${year}" id="year-${year}">
                                  <label class="form-check-label" for="year-${year}">${year}</label>`;
                yearList.appendChild(item);
            });
        })
        .catch(error => {
            console.error('Error fetching filters:', error);
            errorContainer.textContent = 'Failed to load filter data.';
            errorContainer.style.display = 'block';
        });

    // Handle form submission
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const selectedCountries = Array.from(countryList.querySelectorAll('input:checked')).map(input => input.value);
        const selectedYears = Array.from(yearList.querySelectorAll('input:checked')).map(input => input.value);
        const selectedDataset = datasetSelect.value;

        const params = new URLSearchParams();
        selectedCountries.forEach(country => params.append('country', country));
        selectedYears.forEach(year => params.append('year', year));
        params.append('dataset', selectedDataset);

        fetch(`/data?${params.toString()}`)
            .then(response => response.json())
            .then(data => {
                tableBody.innerHTML = '';
                if (data.length === 0) {
                    errorContainer.textContent = 'No data found for the selected filters.';
                    errorContainer.style.display = 'block';
                } else {
                    errorContainer.style.display = 'none';
                    data.forEach(item => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${item.Country}</td>
                            <td>${item['Income Group']}</td>
                            <td>${item['EM and Developed Markets']}</td>
                            <td>${item.Year}</td>
                            <td>${item.Dataset}</td>
                            <td>${item.Value}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                errorContainer.textContent = 'An error occurred while fetching data.';
                errorContainer.style.display = 'block';
            });
    });
});