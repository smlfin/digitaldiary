document.addEventListener('DOMContentLoaded', () => {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLQU5H8LeHi8Xzx1ZuBpyRa9X7hgqIn8IFo6eVP0NdpfpUHM0MuEYd1sddxjkf2KXeyo07663Eg7xD/pub?gid=415786587&single=true&output=csv';

    const branchSelect = document.getElementById('branch-select');
    const employeeSelect = document.getElementById('employee-select');
    const customerSelect = document.getElementById('customer-select');
    const customerDetailsDiv = document.getElementById('customer-details');
    const leftPage = document.getElementById('left-page');
    const rightPage = document.getElementById('right-page');
    const noDataMessage = document.getElementById('no-data-message');
    const messageText = document.getElementById('message-text');

    let allData = [];

    // Function to fetch and parse the CSV data
    const fetchAndParseData = async () => {
        try {
            const response = await fetch(CSV_URL);
            const csvText = await response.text();
            
            const rows = csvText.split('\n').filter(row => row.trim() !== '');
            const headers = rows[0].split(',').map(header => header.trim().replace(/[^a-zA-Z0-9]/g, ''));
            
            const parsedData = rows.slice(1).map(row => {
                const values = row.split(',');
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i] ? values[i].trim() : 'N/A';
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

    // Main function to initialize the dashboard
    const initDashboard = async () => {
        allData = await fetchAndParseData();
        if (allData.length > 0) {
            populateBranches();
            noDataMessage.classList.add('hidden');
        } else {
            messageText.textContent = "No data found in the Google Sheet.";
            noDataMessage.classList.remove('hidden');
        }
    };

    // Function to populate the branch dropdown
    const populateBranches = () => {
        const branches = [...new Set(allData.map(lead => lead.BRANCHNAME))];
        branches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch;
            option.textContent = branch;
            branchSelect.appendChild(option);
        });
    };

    // Event listener for branch selection
    branchSelect.addEventListener('change', () => {
        const selectedBranch = branchSelect.value;
        const employees = [...new Set(allData
            .filter(lead => lead.BRANCHNAME === selectedBranch)
            .map(lead => lead.EMPLOYEENAME))];

        employeeSelect.innerHTML = '<option value="" disabled selected>-- Select Employee --</option>';
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee;
            option.textContent = employee;
            employeeSelect.appendChild(option);
        });
        employeeSelect.disabled = false;
        customerSelect.disabled = true;
        customerSelect.innerHTML = '<option value="" disabled selected>-- Select Customer --</option>';
        customerDetailsDiv.classList.add('hidden');
        noDataMessage.classList.remove('hidden');
        messageText.textContent = "Please select an employee and customer to view details.";
    });

    // Event listener for employee selection
    employeeSelect.addEventListener('change', () => {
        const selectedBranch = branchSelect.value;
        const selectedEmployee = employeeSelect.value;
        const customers = allData
            .filter(lead => lead.BRANCHNAME === selectedBranch && lead.EMPLOYEENAME === selectedEmployee)
            .map(lead => lead.CustomerName);

        customerSelect.innerHTML = '<option value="" disabled selected>-- Select Customer --</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer;
            option.textContent = customer;
            customerSelect.appendChild(option);
        });
        customerSelect.disabled = false;
        customerDetailsDiv.classList.add('hidden');
        noDataMessage.classList.remove('hidden');
        messageText.textContent = "Please select a customer to view details.";
    });

    // Event listener for customer selection
    customerSelect.addEventListener('change', () => {
        const selectedCustomer = customerSelect.value;
        const customerData = allData.find(lead => lead.CustomerName === selectedCustomer);

        if (customerData) {
            renderCustomerDetails(customerData);
            customerDetailsDiv.classList.remove('hidden');
            noDataMessage.classList.add('hidden');
        } else {
            customerDetailsDiv.classList.add('hidden');
            noDataMessage.classList.remove('hidden');
            messageText.textContent = "No data found for the selected customer.";
        }
    });

    // Function to render customer details in a diary-like layout
    const renderCustomerDetails = (data) => {
        const sections = {
            "Lead & Employee Info": [
                { key: 'Timestamp', label: 'Timestamp' },
                { key: 'BRANCHNAME', label: 'Branch Name' },
                { key: 'EMPLOYEENAME', label: 'Employee Name' },
                { key: 'EMPLOYEECODE', label: 'Employee Code' }
            ],
            "Customer Contact Details": [
                { key: 'CustomerName', label: 'Customer Name' },
                { key: 'CustomerAddress', label: 'Customer Address' },
                { key: 'StreetPlace', label: 'Street / Place' },
                { key: 'District', label: 'District' },
                { key: 'Pincode', label: 'Pincode' },
                { key: 'Customerphonenumber', label: 'Customer Phone Number' }
            ],
            "Job & Income": [
                { key: 'JobCategory', label: 'Job Category' },
                { key: 'JobDetails', label: 'Job Details' },
                { key: 'Averagemonthlycome', label: 'Average Monthly Income' }
            ],
            "Personal & Family Details": [
                { key: 'Birthday', label: 'Birthday' },
                { key: 'WeddingDay', label: 'Wedding Day' },
                { key: 'ApproximateAge', label: 'Approximate Age' },
                { key: 'HusbandWifeName', label: 'Husband / Wife Name' },
                { key: 'HusbandWifeJob', label: 'Husband / Wife Job' },
                { key: 'ChildrenNames', label: 'Children Name(s)' },
                { key: 'ChildrenDetails', label: 'Children Details' },
                { key: 'CustomerProfile', label: 'Customer Profile' },
                { key: 'WhethercloseCircleContact', label: 'Close Circle Contact?' },
                { key: 'Detaileddescriptionrelation', label: 'Detailed Description & Relation' }
            ],
            "Lead Status & Follow-up": [
                { key: 'ProductDiscussed', label: 'Product Discussed' },
                { key: 'ClosedAmount', label: 'Closed Amount' },
                { key: 'Howmanyvisitcompleted', label: 'Number of Visits Completed' },
                { key: 'VisitDays', label: 'Visit Days' },
                { key: 'Mention2ndvisit', label: 'Mention 2nd Visit' },
                { key: 'Mention3rdvisit', label: 'Mention 3rd Visit' },
                { key: 'Mention4thvisit', label: 'Mention 4th Visit' },
                { key: 'Remark1', label: 'Remark 1' },
                { key: 'Remark2', label: 'Remark 2' },
                { key: 'Remark3', label: 'Remark 3' },
                { key: 'Remark4', label: 'Remark 4' },
                { key: 'Rmark5', label: 'Remark 5' },
                { key: 'LeadStatus', label: 'Lead Status' }
            ]
        };

        const leftPageSections = ["Lead & Employee Info", "Customer Contact Details"];
        const rightPageSections = ["Job & Income", "Personal & Family Details", "Lead Status & Follow-up"];

        const renderSection = (title, items) => {
            let htmlContent = `<div class="detail-card">
                <h3 class="text-xl font-semibold">${title}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-y-4 gap-x-8">`;
            items.forEach(item => {
                const value = data[item.key] || 'N/A';
                htmlContent += `
                    <div class="detail-item">
                        <p>${item.label}</p>
                        <p class="mt-1">${value}</p>
                    </div>`;
            });
            htmlContent += `</div></div>`;
            return htmlContent;
        };

        let leftContent = '';
        leftPageSections.forEach(sectionTitle => {
            if (sections[sectionTitle]) {
                leftContent += renderSection(sectionTitle, sections[sectionTitle]);
            }
        });

        let rightContent = '';
        rightPageSections.forEach(sectionTitle => {
            if (sections[sectionTitle]) {
                rightContent += renderSection(sectionTitle, sections[sectionTitle]);
            }
        });

        leftPage.innerHTML = leftContent;
        rightPage.innerHTML = rightContent;
    };

    // Kick off the data fetching
    initDashboard();
});