document.addEventListener('DOMContentLoaded', () => {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLQU5H8LeHi8Xzx1ZuBpyRa9X7hgqIn8IFo6eVP0NdpfpUHM0MuEYd1sddxjkf2KXeyo07663Eg7xD/pub?gid=415786587&single=true&output=csv';

    const jobCategoryContainer = document.getElementById('job-category-container');
    const ageIncomeContainer = document.getElementById('age-income-container');
    const geographicDistributionContainer = document.getElementById('geographic-distribution-container');
    const familyStatusContainer = document.getElementById('family-status-container');
    const noDataMessage = document.getElementById('demographics-no-data-message');
    const messageText = document.getElementById('demographics-message-text');

    const fetchAndParseData = async () => {
        try {
            const response = await fetch(CSV_URL);
            const csvText = await response.text();
            
            const rows = csvText.split('\n').filter(row => row.trim() !== '');
            const headers = rows[0].split(',').map(header => header.trim().replace(/[^a-zA-Z0-9]/g, ''));

            const parsedData = rows.slice(1).map(row => {
                const values = [];
                let inQuote = false;
                let currentItem = '';

                for (let i = 0; i < row.length; i++) {
                    const char = row[i];
                    if (char === '"') inQuote = !inQuote;
                    else if (char === ',' && !inQuote) {
                        values.push(currentItem.trim());
                        currentItem = '';
                    } else currentItem += char;
                }
                values.push(currentItem.trim());
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i] || 'N/A';
                });
                return obj;
            });
            return parsedData;
        } catch (error) {
            console.error("Error fetching or parsing CSV:", error);
            messageText.textContent = "Failed to load data. Please check the CSV link and your network connection.";
            return [];
        }
    };

    const generateJobCategoryReport = (data) => {
        const jobCategoryCounts = {};
        data.forEach(lead => {
            const jobCategory = lead.JobCategory || 'N/A';
            if (!jobCategoryCounts[jobCategory]) {
                jobCategoryCounts[jobCategory] = 0;
            }
            jobCategoryCounts[jobCategory]++;
        });

        let htmlContent = `<div class="bg-gray-50 rounded-lg p-6 shadow-inner">
            <h3 class="text-2xl font-bold mb-4">Customer Profile by Job Category</h3>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-gray-600 uppercase text-sm leading-normal">
                        <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Job Category</th>
                        <th class="py-3 px-6 bg-green-200 text-green-700 font-bold border-b border-gray-300">Number of Leads</th>
                    </tr>
                </thead>
                <tbody class="text-gray-800 text-base font-light">`;
        
        for (const category in jobCategoryCounts) {
            htmlContent += `
                <tr class="hover:bg-gray-100 transition-colors">
                    <td class="py-3 px-6 whitespace-nowrap">${category}</td>
                    <td class="py-3 px-6 font-semibold text-green-600">${jobCategoryCounts[category]}</td>
                </tr>`;
        }
        
        htmlContent += `
                </tbody>
            </table>
        </div>`;
        jobCategoryContainer.innerHTML = htmlContent;
    };

    const generateAgeIncomeReport = (data) => {
        const ageGroups = {
            '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0, 'N/A': 0
        };
        const incomeGroups = {
            '< 25k': 0, '25k-50k': 0, '50k-100k': 0, '100k+': 0, 'N/A': 0
        };

        data.forEach(lead => {
            const age = parseInt(lead.ApproximateAge);
            if (!isNaN(age)) {
                if (age >= 18 && age <= 25) ageGroups['18-25']++;
                else if (age >= 26 && age <= 35) ageGroups['26-35']++;
                else if (age >= 36 && age <= 45) ageGroups['36-45']++;
                else if (age >= 46 && age <= 55) ageGroups['46-55']++;
                else if (age >= 56) ageGroups['56+']++;
            } else {
                ageGroups['N/A']++;
            }
            
            const income = parseFloat(lead.Averagemonthlycome);
            if (!isNaN(income)) {
                if (income < 25000) incomeGroups['< 25k']++;
                else if (income >= 25000 && income <= 50000) incomeGroups['25k-50k']++;
                else if (income > 50000 && income <= 100000) incomeGroups['50k-100k']++;
                else if (income > 100000) incomeGroups['100k+']++;
            } else {
                incomeGroups['N/A']++;
            }
        });

        let htmlContent = `<div class="bg-gray-50 rounded-lg p-6 shadow-inner">
            <h3 class="text-2xl font-bold mb-4">Age and Income Demographics</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 class="text-xl font-semibold mb-2">Age Distribution</h4>
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="text-gray-600 uppercase text-sm leading-normal">
                                <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Age Group</th>
                                <th class="py-3 px-6 bg-green-200 text-green-700 font-bold border-b border-gray-300">Number of Leads</th>
                            </tr>
                        </thead>
                        <tbody class="text-gray-800 text-base font-light">`;
        for (const ageGroup in ageGroups) {
            htmlContent += `
                            <tr class="hover:bg-gray-100 transition-colors">
                                <td class="py-3 px-6 whitespace-nowrap">${ageGroup}</td>
                                <td class="py-3 px-6 font-semibold text-green-600">${ageGroups[ageGroup]}</td>
                            </tr>`;
        }
        htmlContent += `
                        </tbody>
                    </table>
                </div>
                <div>
                    <h4 class="text-xl font-semibold mb-2">Income Distribution</h4>
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="text-gray-600 uppercase text-sm leading-normal">
                                <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Income Group</th>
                                <th class="py-3 px-6 bg-green-200 text-green-700 font-bold border-b border-gray-300">Number of Leads</th>
                            </tr>
                        </thead>
                        <tbody class="text-gray-800 text-base font-light">`;
        for (const incomeGroup in incomeGroups) {
            htmlContent += `
                            <tr class="hover:bg-gray-100 transition-colors">
                                <td class="py-3 px-6 whitespace-nowrap">${incomeGroup}</td>
                                <td class="py-3 px-6 font-semibold text-green-600">${incomeGroups[incomeGroup]}</td>
                            </tr>`;
        }
        htmlContent += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
        ageIncomeContainer.innerHTML = htmlContent;
    };

    const generateGeographicReport = (data) => {
        const districtCounts = {};
        const pincodeCounts = {};

        data.forEach(lead => {
            const district = lead.District || 'N/A';
            const pincode = lead.Pincode || 'N/A';
            if (!districtCounts[district]) districtCounts[district] = 0;
            districtCounts[district]++;
            if (!pincodeCounts[pincode]) pincodeCounts[pincode] = 0;
            pincodeCounts[pincode]++;
        });

        let htmlContent = `<div class="bg-gray-50 rounded-lg p-6 shadow-inner">
            <h3 class="text-2xl font-bold mb-4">Geographic Sales Distribution</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 class="text-xl font-semibold mb-2">Leads by District</h4>
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="text-gray-600 uppercase text-sm leading-normal">
                                <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">District</th>
                                <th class="py-3 px-6 bg-green-200 text-green-700 font-bold border-b border-gray-300">Number of Leads</th>
                            </tr>
                        </thead>
                        <tbody class="text-gray-800 text-base font-light">`;
        for (const district in districtCounts) {
            htmlContent += `
                            <tr class="hover:bg-gray-100 transition-colors">
                                <td class="py-3 px-6 whitespace-nowrap">${district}</td>
                                <td class="py-3 px-6 font-semibold text-green-600">${districtCounts[district]}</td>
                            </tr>`;
        }
        htmlContent += `
                        </tbody>
                    </table>
                </div>
                <div>
                    <h4 class="text-xl font-semibold mb-2">Leads by Pincode</h4>
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="text-gray-600 uppercase text-sm leading-normal">
                                <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Pincode</th>
                                <th class="py-3 px-6 bg-green-200 text-green-700 font-bold border-b border-gray-300">Number of Leads</th>
                            </tr>
                        </thead>
                        <tbody class="text-gray-800 text-base font-light">`;
        for (const pincode in pincodeCounts) {
            htmlContent += `
                            <tr class="hover:bg-gray-100 transition-colors">
                                <td class="py-3 px-6 whitespace-nowrap">${pincode}</td>
                                <td class="py-3 px-6 font-semibold text-green-600">${pincodeCounts[pincode]}</td>
                            </tr>`;
        }
        htmlContent += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
        geographicDistributionContainer.innerHTML = htmlContent;
    };

    const generateFamilyStatusReport = (data) => {
        const familyStatusCounts = {
            'Married (Husband/Wife Name)': 0,
            'Has Children': 0,
            'Other': 0
        };

        data.forEach(lead => {
            const hasSpouse = (lead.HusbandWifeName && lead.HusbandWifeName.trim() !== '' && lead.HusbandWifeName.trim() !== 'N/A' && lead.HusbandWifeName.trim() !== '.');
            const hasChildren = (lead.ChildrenNames && lead.ChildrenNames.trim() !== '' && lead.ChildrenNames.trim() !== 'N/A' && lead.ChildrenNames.trim() !== '.');
            
            if (hasSpouse) {
                familyStatusCounts['Married (Husband/Wife Name)']++;
            }
            if (hasChildren) {
                familyStatusCounts['Has Children']++;
            }
            if (!hasSpouse && !hasChildren) {
                familyStatusCounts['Other']++;
            }
        });

        let htmlContent = `<div class="bg-gray-50 rounded-lg p-6 shadow-inner">
            <h3 class="text-2xl font-bold mb-4">Family Status Analysis</h3>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-gray-600 uppercase text-sm leading-normal">
                        <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Family Status</th>
                        <th class="py-3 px-6 bg-green-200 text-green-700 font-bold border-b border-gray-300">Number of Leads</th>
                    </tr>
                </thead>
                <tbody class="text-gray-800 text-base font-light">`;
        
        for (const status in familyStatusCounts) {
            htmlContent += `
                <tr class="hover:bg-gray-100 transition-colors">
                    <td class="py-3 px-6 whitespace-nowrap">${status}</td>
                    <td class="py-3 px-6 font-semibold text-green-600">${familyStatusCounts[status]}</td>
                </tr>`;
        }
        
        htmlContent += `
                </tbody>
            </table>
        </div>`;
        familyStatusContainer.innerHTML = htmlContent;
    };

    const initDemographicsReports = async () => {
        const allData = await fetchAndParseData();
        if (allData.length > 0) {
            generateJobCategoryReport(allData);
            generateAgeIncomeReport(allData);
            generateGeographicReport(allData);
            generateFamilyStatusReport(allData);
            noDataMessage.classList.add('hidden');
        } else {
            messageText.textContent = "No data found in the Google Sheet.";
            noDataMessage.classList.remove('hidden');
        }
    };
    
    initDemographicsReports();
});