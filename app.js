document.addEventListener('DOMContentLoaded', () => {
    console.log('app.js loaded and DOMContentLoaded fired.');

    const countrySelect = document.getElementById('country');
    const datasetSelect = document.getElementById('dataset');
    const yearSelect = document.getElementById('year');
    const filterForm = document.getElementById('filter-form');
    const tableBody = document.getElementById('table-body');
    const errorContainer = document.getElementById('error-container');

    // Helper function to fetch data and populate a select element
    async function fetchDataAndPopulateDropdown(endpoint, selectElement, param = null) {
        try {
            let url = `${window.location.origin}${endpoint}`;
            if (param) {
                url += `?country=${param}`;
            }
            console.log(`Fetching from: ${url}`); // Log the URL being fetched
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            selectElement.innerHTML = ''; // Clear existing options
            if (data.length === 0) {
                console.warn(`Received empty list from ${endpoint} API.`);
                const option = document.createElement('option');
                option.value = '';
                option.textContent = `No data available`;
                selectElement.appendChild(option);
            } else {
                data.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item;
                    option.textContent = item;
                    selectElement.appendChild(option);
                });
            }
            return data; // Return data for further processing if needed
        } catch (error) {
            console.error(`Error fetching data from ${endpoint}:`, error);
            errorContainer.textContent = `Failed to load data from ${endpoint}. Please check console for details.`;
            errorContainer.style.display = 'block';
            return []; // Return empty array on error
        }
    }

    // Initial fetch for countries and datasets on page load
    fetchDataAndPopulateDropdown('/countries', countrySelect).then(countries => {
        // After countries are loaded, trigger change event to populate years for the first country
        if (countries.length > 0) {
            countrySelect.dispatchEvent(new Event('change'));
        }
    });
    fetchDataAndPopulateDropdown('/datasets', datasetSelect);

    // Event listener for country selection change to update years
    countrySelect.addEventListener('change', () => {
        const selectedCountry = countrySelect.value;
        fetchDataAndPopulateDropdown('/years', yearSelect, selectedCountry);
    });

    // Form submission handler
    filterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const country = countrySelect.value;
        const dataset = datasetSelect.value;
        const year = yearSelect.value;

        let url = `${window.location.origin}/data?`;
        if (country) url += `country=${country}&`;
        if (year) url += `year=${year}&`;
        if (dataset) url += `dataset=${dataset}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

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
        } catch (error) {
            errorContainer.textContent = 'An error occurred while fetching data.';
            errorContainer.style.display = 'block';
            console.error('Error:', error);
        }
    });
});