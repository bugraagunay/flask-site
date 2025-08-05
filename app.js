document.addEventListener('DOMContentLoaded', () => {
    const countrySelect = document.getElementById('country');
    const datasetSelect = document.getElementById('dataset');
    const yearSelect = document.getElementById('year');
    const filterForm = document.getElementById('filter-form');
    const tableBody = document.getElementById('table-body');
    const errorContainer = document.getElementById('error-container');

    // Fetch countries and populate dropdown
    fetch('/countries')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(countries => {
            if (countries.length === 0) {
                console.warn('Received empty countries list from API.');
            }
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                countrySelect.appendChild(option);
            });
            // Trigger change event to populate years for the first country
            countrySelect.dispatchEvent(new Event('change'));
        })
        .catch(error => {
            console.error('Error fetching countries:', error);
            errorContainer.textContent = 'Failed to load countries. Please check console for details.';
            errorContainer.style.display = 'block';
        });

    // Fetch datasets and populate dropdown
    fetch('/datasets')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(datasets => {
            if (datasets.length === 0) {
                console.warn('Received empty datasets list from API.');
            }
            datasets.forEach(dataset => {
                const option = document.createElement('option');
                option.value = dataset;
                option.textContent = dataset;
                datasetSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error fetching datasets:', error);
            errorContainer.textContent = 'Failed to load datasets. Please check console for details.';
            errorContainer.style.display = 'block';
        });

    // Fetch years based on country selection
    countrySelect.addEventListener('change', () => {
        const selectedCountry = countrySelect.value;
        if (!selectedCountry) {
            yearSelect.innerHTML = ''; // Clear years if no country is selected
            return;
        }
        fetch(`/years?country=${selectedCountry}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(years => {
                yearSelect.innerHTML = '';
                if (years.length === 0) {
                    console.warn(`Received empty years list for ${selectedCountry} from API.`);
                }
                years.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    yearSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error(`Error fetching years for ${selectedCountry}:`, error);
                errorContainer.textContent = `Failed to load years for ${selectedCountry}. Please check console for details.`;
                errorContainer.style.display = 'block';
            });
    });

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const country = countrySelect.value;
        const dataset = datasetSelect.value;
        const year = yearSelect.value;

        let url = `/data?`;
        if (country) url += `country=${country}&`;
        if (year) url += `year=${year}&`;
        if (dataset) url += `dataset=${dataset}`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
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
                            <td>${item.Value !== null ? item.Value : 'N/A'}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                }
            })
            .catch(error => {
                errorContainer.textContent = 'An error occurred while fetching data.';
                errorContainer.style.display = 'block';
                console.error('Error:', error);
            });
    });
});