document.addEventListener('DOMContentLoaded', () => {
    console.log('app.js loaded and DOMContentLoaded fired.');

    const countrySelect = document.getElementById('country');
    const datasetSelect = document.getElementById('dataset');
    const yearSelect = document.getElementById('year');
    const filterForm = document.getElementById('filter-form');
    const tableBody = document.getElementById('table-body');
    const errorContainer = document.getElementById('error-container');

    async function populateFilters() {
        try {
            let url = `${window.location.origin}/filters`;
            console.log(`Fetching from: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Populate Countries
            countrySelect.innerHTML = '';
            if (data.countries.length > 0) {
                data.countries.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item;
                    option.textContent = item;
                    countrySelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No countries available';
                countrySelect.appendChild(option);
            }

            // Populate Datasets
            datasetSelect.innerHTML = '';
            if (data.datasets.length > 0) {
                data.datasets.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item;
                    option.textContent = item;
                    datasetSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No datasets available';
                datasetSelect.appendChild(option);
            }

            // Populate Years
            yearSelect.innerHTML = '';
            if (data.years.length > 0) {
                data.years.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item;
                    option.textContent = item;
                    yearSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No years available';
                yearSelect.appendChild(option);
            }

        } catch (error) {
            console.error('Error fetching filters:', error);
            errorContainer.textContent = 'Failed to load filters. Please check console for details.';
            errorContainer.style.display = 'block';
        }
    }

    populateFilters();

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
