document.addEventListener('DOMContentLoaded', () => {
    // Element references
    const countrySearchInput = document.getElementById('country-search');
    const countryBoxesContainer = document.getElementById('country-boxes');
    const datasetSelect = document.getElementById('dataset');
    const yearList = document.getElementById('year-list');
    const filterForm = document.getElementById('filter-form');
    const tableBody = document.getElementById('table-body');
    const errorContainer = document.getElementById('error-container');

    // State variables
    let allCountries = [];
    const selectedCountries = new Set();

    // Utility functions
    const debounce = (fn, ms = 200) => {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), ms);
        };
    };
    const toTRLower = s => (s ?? '').toLocaleLowerCase('tr');

    // --- Country List Rendering and Handling ---

    const renderCountryBoxes = (countriesToRender) => {
        countryBoxesContainer.innerHTML = ''; // Clear existing list
        countriesToRender.forEach(country => {
            const isChecked = selectedCountries.has(country);
            const item = document.createElement('div');
            item.className = 'form-check';
            item.innerHTML = `
                <input class="form-check-input" type="checkbox" value="${country}" id="country-${country}" ${isChecked ? 'checked' : ''}>
                <label class="form-check-label" for="country-${country}">${country}</label>
            `;
            countryBoxesContainer.appendChild(item);
        });
    };

    // Use event delegation for checkbox changes
    countryBoxesContainer.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const country = e.target.value;
            if (e.target.checked) {
                selectedCountries.add(country);
            } else {
                selectedCountries.delete(country);
            }
        }
    });

    // Handle search input
    const handleSearch = () => {
        const searchTerm = toTRLower(countrySearchInput.value);
        if (!searchTerm) {
            renderCountryBoxes(allCountries);
            return;
        }
        const filtered = allCountries.filter(country => toTRLower(country).startsWith(searchTerm));
        renderCountryBoxes(filtered);
    };

    countrySearchInput.addEventListener('input', debounce(handleSearch, 200));


    // --- Initial Data Fetch ---

    fetch('/filters')
        .then(response => response.json())
        .then(data => {
            // Store and render countries
            allCountries = data.countries.sort((a, b) => a.localeCompare(b, 'tr')); // Sort once
            renderCountryBoxes(allCountries);

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


    // --- Form Submission ---

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const countries = Array.from(selectedCountries);
        const selectedYears = Array.from(yearList.querySelectorAll('input:checked')).map(input => input.value);
        const selectedDataset = datasetSelect.value;

        if (countries.length === 0 || selectedYears.length === 0) {
            errorContainer.textContent = 'Please select at least one country and one year.';
            errorContainer.style.display = 'block';
            tableBody.innerHTML = '';
            return;
        }

        const params = new URLSearchParams();
        countries.forEach(country => params.append('country', country));
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