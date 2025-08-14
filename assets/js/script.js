// Main JavaScript functionality for the research website

// GitHub API functionality with caching
async function fetchGitHubStats() {
    const username = 'ZhiangChen';
    const cacheKey = `github_stats_${username}`;
    const cacheExpiry = 10 * 60 * 1000; // 10 minutes
    
    // Clear old cache that might have the wrong structure
    localStorage.removeItem(cacheKey);
    
    // Check cache first
    const cachedData = getCachedData(cacheKey, cacheExpiry);
    if (cachedData && cachedData.organizations !== undefined) {
        console.log('Using cached data:', cachedData);
        updateGitHubStatsDisplay(cachedData);
        return cachedData;
    }
    
    // Add loading state
    addLoadingState();
    
    try {
        // Fetch user data
        const userResponse = await fetch(`https://api.github.com/users/${username}`);
        if (!userResponse.ok) {
            throw new Error(`User API request failed: ${userResponse.status}`);
        }
        const userData = await userResponse.json();
        
        // Fetch repositories data
        const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
        if (!reposResponse.ok) {
            throw new Error(`Repos API request failed: ${reposResponse.status}`);
        }
        const reposData = await reposResponse.json();
        
        // Calculate stats
        const stats = {
            repositories: userData.public_repos || reposData.length,
            stars: reposData.reduce((total, repo) => total + repo.stargazers_count, 0),
            forks: reposData.reduce((total, repo) => total + repo.forks_count, 0),
            organizations: 5  // Manually set to 5
        };
        
        console.log('New stats:', stats);
        
        // Cache the data
        setCachedData(cacheKey, stats);
        
        // Remove loading state and update the DOM
        removeLoadingState();
        updateGitHubStatsDisplay(stats);
        
        return stats;
    } catch (error) {
        console.error('Error fetching GitHub stats:', error);
        removeLoadingState();
        // Keep the existing static values if API fails
        showErrorMessage();
        return null;
    }
}

// Cache management functions
function getCachedData(key, maxAge) {
    try {
        const cached = localStorage.getItem(key);
        if (cached) {
            const data = JSON.parse(cached);
            const now = Date.now();
            if (now - data.timestamp < maxAge) {
                return data.stats;
            } else {
                localStorage.removeItem(key);
            }
        }
    } catch (error) {
        console.error('Error reading from cache:', error);
    }
    return null;
}

function setCachedData(key, stats) {
    try {
        const data = {
            stats: stats,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error writing to cache:', error);
    }
}

function showErrorMessage() {
    const statsSection = document.querySelector('.github-stats');
    if (statsSection) {
        // Create or update error message
        let errorMsg = statsSection.querySelector('.api-error');
        if (!errorMsg) {
            errorMsg = document.createElement('p');
            errorMsg.className = 'api-error';
            errorMsg.style.textAlign = 'center';
            errorMsg.style.color = 'rgba(255, 255, 255, 0.8)';
            errorMsg.style.marginTop = '1rem';
            errorMsg.style.fontSize = '0.9rem';
            statsSection.querySelector('.container').appendChild(errorMsg);
        }
        errorMsg.textContent = 'Unable to fetch live data. Showing cached values.';
    }
}

function addLoadingState() {
    const statNumbers = document.querySelectorAll('.github-stats .stat-number');
    statNumbers.forEach(number => {
        number.classList.add('loading');
    });
}

function removeLoadingState() {
    const statNumbers = document.querySelectorAll('.github-stats .stat-number');
    statNumbers.forEach(number => {
        number.classList.remove('loading');
    });
}

// Function to animate numbers counting up
function animateNumber(element, finalNumber, duration = 1000) {
    const startNumber = 0;
    const increment = finalNumber / (duration / 16); // 60fps
    let currentNumber = startNumber;
    
    const timer = setInterval(() => {
        currentNumber += increment;
        if (currentNumber >= finalNumber) {
            currentNumber = finalNumber;
            clearInterval(timer);
        }
        element.textContent = Math.floor(currentNumber);
    }, 16);
}

// Enhanced GitHub stats update with animation
function updateGitHubStatsDisplay(stats) {
    console.log('Updating display with stats:', stats);
    const statCards = document.querySelectorAll('.github-stats .stat-card');
    console.log('Found stat cards:', statCards.length);
    
    if (statCards.length >= 5) {
        // Animate GitHub-sourced numbers
        console.log('Animating repositories:', stats.repositories);
        animateNumber(statCards[0].querySelector('.stat-number'), stats.repositories);
        
        console.log('Animating stars:', stats.stars);
        animateNumber(statCards[1].querySelector('.stat-number'), stats.stars);
        
        console.log('Animating forks:', stats.forks);
        animateNumber(statCards[2].querySelector('.stat-number'), stats.forks);
        
        console.log('Animating organizations:', stats.organizations);
        animateNumber(statCards[3].querySelector('.stat-number'), stats.organizations);
        
        // Also animate the datasets count (5th card) to maintain consistent styling
        const datasetsNumber = parseInt(statCards[4].querySelector('.stat-number').textContent);
        console.log('Animating datasets:', datasetsNumber);
        animateNumber(statCards[4].querySelector('.stat-number'), datasetsNumber);
    }
}

// Initialize when page loads - removed to consolidate with new function at end

// Featured Repositories functionality
async function fetchFeaturedRepositories() {
    const username = 'ZhiangChen';
    const featuredRepos = [
        'shakebot',
        'uav_motion', 
        'gps_vio',
        'deep_learning'
    ];
    
    const cacheKey = `featured_repos_${username}`;
    const cacheExpiry = 30 * 60 * 1000; // 30 minutes
    
    // Check cache first
    const cachedData = getCachedData(cacheKey, cacheExpiry);
    if (cachedData && Array.isArray(cachedData)) {
        console.log('Using cached featured repos data:', cachedData);
        updateFeaturedRepositoriesDisplay(cachedData);
        return cachedData;
    }
    
    // Add loading state
    addFeaturedReposLoadingState();
    
    try {
        const repoPromises = featuredRepos.map(async (repoName) => {
            console.log(`Fetching repository: ${repoName}`);
            const response = await fetch(`https://api.github.com/repos/${username}/${repoName}`);
            console.log(`Response for ${repoName}:`, response.status, response.statusText);
            
            if (!response.ok) {
                if (response.status === 403) {
                    console.warn(`Rate limit exceeded for ${repoName}`);
                } else if (response.status === 404) {
                    console.warn(`Repository ${repoName} not found`);
                } else {
                    console.error(`Failed to fetch ${repoName}: ${response.status} ${response.statusText}`);
                }
                // Return fallback data for failed repos
                return getFallbackRepoData(repoName);
            }
            return await response.json();
        });
        
        const reposData = await Promise.all(repoPromises);
        console.log('Fetched featured repos data:', reposData);
        
        // Filter out any null responses
        const validReposData = reposData.filter(repo => repo !== null);
        
        if (validReposData.length === 0) {
            throw new Error('No repositories could be fetched');
        }
        
        // Cache the data
        setCachedData(cacheKey, validReposData);
        
        // Remove loading state and update display
        removeFeaturedReposLoadingState();
        updateFeaturedRepositoriesDisplay(validReposData);
        
        return validReposData;
    } catch (error) {
        console.error('Error fetching featured repositories:', error);
        removeFeaturedReposLoadingState();
        
        // Try to use fallback data instead of showing error
        const fallbackData = getFallbackRepositoriesData();
        updateFeaturedRepositoriesDisplay(fallbackData);
        
        return fallbackData;
    }
}

// Fallback data for individual repositories
function getFallbackRepoData(repoName) {
    const fallbackRepos = {
        'shakebot': {
            name: 'shakebot',
            description: 'A low-cost, open-sourced shake table for earthquake research and education. Provides affordable access to structural seismology research tools.',
            html_url: 'https://github.com/ZhiangChen/shakebot',
            stargazers_count: 0,
            forks_count: 0,
            language: 'Python',
            topics: ['Arduino', 'Earthquake Research']
        },
        'uav_motion': {
            name: 'uav_motion',
            description: 'Minimum-snap trajectory generation and attitude control for PX4-based rotary wing drones.',
            html_url: 'https://github.com/ZhiangChen/uav_motion',
            stargazers_count: 29,
            forks_count: 7,
            language: 'C++',
            topics: ['PX4', 'UAV Control']
        },
        'gps_vio': {
            name: 'gps_vio',
            description: 'Odometry Fusion of PX4 GPS and Realsense T265 VIO for improved localization accuracy.',
            html_url: 'https://github.com/ZhiangChen/gps_vio',
            stargazers_count: 28,
            forks_count: 5,
            language: 'C++',
            topics: ['GPS', 'VIO']
        },
        'deep_learning': {
            name: 'deep_learning',
            description: 'Deep-learning approaches to object recognition from 3D data for geoscience applications.',
            html_url: 'https://github.com/ZhiangChen/deep_learning',
            stargazers_count: 19,
            forks_count: 7,
            language: 'Python',
            topics: ['Deep Learning', '3D Vision']
        }
    };
    
    return fallbackRepos[repoName] || null;
}

// Complete fallback data for all repositories
function getFallbackRepositoriesData() {
    return [
        {
            name: 'shakebot',
            description: 'A low-cost, open-sourced shake table for earthquake research and education. Provides affordable access to structural seismology research tools.',
            html_url: 'https://github.com/ZhiangChen/shakebot',
            stargazers_count: 0,
            forks_count: 0,
            language: 'Python',
            topics: ['Arduino', 'Earthquake Research']
        },
        {
            name: 'uav_motion',
            description: 'Minimum-snap trajectory generation and attitude control for PX4-based rotary wing drones.',
            html_url: 'https://github.com/ZhiangChen/uav_motion',
            stargazers_count: 29,
            forks_count: 7,
            language: 'C++',
            topics: ['PX4', 'UAV Control']
        },
        {
            name: 'gps_vio',
            description: 'Odometry Fusion of PX4 GPS and Realsense T265 VIO for improved localization accuracy.',
            html_url: 'https://github.com/ZhiangChen/gps_vio',
            stargazers_count: 28,
            forks_count: 5,
            language: 'C++',
            topics: ['GPS', 'VIO']
        },
        {
            name: 'deep_learning',
            description: 'Deep-learning approaches to object recognition from 3D data for geoscience applications.',
            html_url: 'https://github.com/ZhiangChen/deep_learning',
            stargazers_count: 19,
            forks_count: 7,
            language: 'Python',
            topics: ['Deep Learning', '3D Vision']
        }
    ];
}

function updateFeaturedRepositoriesDisplay(reposData) {
    const reposGrid = document.querySelector('.repos-grid');
    if (!reposGrid || !reposData) return;
    
    // Clear existing content
    reposGrid.innerHTML = '';
    
    reposData.forEach(repo => {
        const repoCard = createRepositoryCard(repo);
        reposGrid.appendChild(repoCard);
    });
}

function createRepositoryCard(repo) {
    const card = document.createElement('div');
    card.className = 'repo-card';
    
    // Get primary language and topics
    const language = repo.language || 'Unknown';
    const topics = repo.topics || [];
    
    // Format description
    const description = repo.description || 'No description available.';
    
    // Create tags from language and topics
    const tags = [language, ...topics.slice(0, 2)].filter(Boolean);
    
    card.innerHTML = `
        <div class="repo-header">
            <h3>${repo.name}</h3>
            <div class="repo-stats">
                <span class="repo-stat"><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
                <span class="repo-stat"><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
            </div>
        </div>
        <p class="repo-description">${description}</p>
        <div class="repo-tags">
            ${tags.map(tag => `<span class="repo-tag">${tag}</span>`).join('')}
        </div>
        <div class="repo-links">
            <a href="${repo.html_url}" target="_blank" class="repo-link">
                <i class="fab fa-github"></i> View on GitHub
            </a>
            ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" class="repo-link">
                <i class="fas fa-external-link-alt"></i> Live Demo
            </a>` : ''}
            ${repo.has_wiki ? `<a href="${repo.html_url}/wiki" target="_blank" class="repo-link">
                <i class="fas fa-book"></i> Documentation
            </a>` : ''}
        </div>
    `;
    
    return card;
}

function addFeaturedReposLoadingState() {
    const reposGrid = document.querySelector('.repos-grid');
    if (reposGrid) {
        reposGrid.classList.add('loading');
        reposGrid.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading featured repositories...</p>
            </div>
        `;
    }
}

function removeFeaturedReposLoadingState() {
    const reposGrid = document.querySelector('.repos-grid');
    if (reposGrid) {
        reposGrid.classList.remove('loading');
    }
}

function showFeaturedReposErrorMessage() {
    const reposGrid = document.querySelector('.repos-grid');
    if (reposGrid) {
        // Since we now have fallback data, this function is less likely to be called
        // But if it is, show a more user-friendly message
        reposGrid.innerHTML = `
            <div class="info-message">
                <i class="fas fa-info-circle"></i>
                <p>Showing cached repository information. Live data will be updated when available.</p>
            </div>
        `;
    }
}

// Publications Data Structure - Single Source of Truth
const publicationsData = [
    // In Preparation
    {
        year: 2026,
        title: "Virtual Shake Robot 2: Benchmarking Physics Engine for Overturning Precariously Balanced Rocks and Constraining Local Ground Motions",
        authors: "Chen, Z., Mahalle, A., Saifullah, K., Das, J., Wittich, C., Kottke, A., Madugo, C., & Arrowsmith, R. (2026)",
        journal: "Rock Mechanics and Rock Engineering. In prep",
        abstract: "Benchmarking physics engines for accurate simulation of precariously balanced rock overturning dynamics and constraining local ground motion parameters.",
        categories: ["preprint"],
        status: "In Preparation",
        links: []
    },
    {
        year: 2026,
        title: "A Rapid Response System with Heterogeneous Multi-UAVs and Machine Learning for Mapping Earthquake Surface Fractures",
        authors: "Chen, Z., Rodriguez Padilla, A., Scharer, K., McPhillips, D., & Ross, Z. (2025)",
        journal: "In prep",
        abstract: "Development of a rapid response system using multiple UAVs and machine learning for mapping earthquake surface fractures.",
        categories: ["preprint"],
        status: "In Preparation",
        links: []
    },
    {
        year: 2025,
        title: "Rapid hazard assessment and prediction of post-fire debris flows using UAV lidar: Eaton Fire, California",
        authors: "Chen, Z., Geyman, E., & Lamb, M. P. (2025)",
        journal: "Landslides. Under review",
        abstract: "Rapid hazard assessment and prediction methodology for post-fire debris flows using UAV-based lidar technology, applied to the Eaton Fire case study in California.",
        categories: ["preprint"],
        status: "Under Review",
        links: []
    },
    {
        year: 2025,
        title: "3D Semantic Mapping of Surface Geological Features",
        authors: "Chen, Z., McPhillips, D., Scharer, K., & Ross, Z. E. (2025)",
        journal: "Computers & Geosciences. Under review",
        abstract: "Development of 3D semantic mapping techniques for automated identification and characterization of surface geological features using advanced computer vision and machine learning approaches.",
        categories: ["preprint"],
        status: "Under Review",
        links: []
    },
    {
        year: 2026,
        title: "Mapping Precariously Balanced Rocks: Demonstrating A Target-oriented Mapping System for Unpiloted Aerial Vehicles",
        authors: "Chen, Z., Das, J., & Arrowsmith, R. (2025)",
        journal: "Journal of Field Robotics. In prep",
        abstract: "Demonstration of a target-oriented mapping system using unpiloted aerial vehicles for geological feature mapping.",
        categories: ["preprint"],
        status: "In Preparation",
        links: []
    },
    {
        year: 2026,
        title: "Improving Instance Segmentation Applications in Remote Sensing: Algorithms and Data Structures for Instances on Image Boundaries",
        authors: "Chen, Z., & Arrowsmith, R. (2025)",
        journal: "GIScience & Remote Sensing. In review",
        abstract: "Novel algorithms and data structures for handling instances on image boundaries in remote sensing applications.",
        categories: ["preprint"],
        status: "In Review",
        links: []
    },
    
    // Peer-reviewed Publications
    {
        year: 2024,
        title: "Shakebot: A Low-cost, Open-sourced Shake Table for Earthquake Research and Education",
        authors: "Chen, Z., Keating, D., Shethwala, Y., Pandian Saravanakumaran, A., Arrowsmith, R., Kottke, A., Wittich, C., & Das, J. (2024)",
        journal: "2024 IEEE International Conference on Automation Science and Engineering",
        abstract: "Development of a low-cost, open-source shake table for earthquake research and education applications.",
        categories: ["conference"],
        status: "Published",
        links: []
    },
    {
        year: 2024,
        title: "Virtual Shake Robot: Simulating Dynamics of Precariously Balanced Rocks for Overturning and Large-displacement Processes",
        authors: "Chen, Z., Arrowsmith, R., Das, J., Wittich, C., Madugo, C., & Kottke, A. (2024)",
        journal: "Seismica. 3(1)",
        abstract: "Simulation of precariously balanced rock dynamics for overturning and large-displacement processes using virtual shake robot technology.",
        categories: ["journal"],
        status: "Published",
        links: []
    },
    {
        year: 2023,
        title: "A Survey of Decision-Theoretic Approaches for Robotic Environmental Monitoring",
        authors: "Sung, Y., Chen, Z., Das, J., & Tokekar, P. (2023)",
        journal: "Foundations and Trends® in Robotics, 11(4), 225-315",
        abstract: "Comprehensive survey of decision-theoretic approaches for robotic environmental monitoring applications.",
        categories: ["journal"],
        status: "Published",
        links: []
    },
    {
        year: 2023,
        title: "Quantifying and Analyzing Rock Trait Distributions of Rocky Fault Scarps Using Deep Learning",
        authors: "Chen, Z., Scott, C., Keating, D., Clark, A., Das, J., & Arrowsmith, R. (2023)",
        journal: "Earth Surface Processes and Landforms. 48(6), 1234-1250",
        abstract: "Deep learning approach for quantifying and analyzing rock trait distributions in rocky fault scarps.",
        categories: ["journal"],
        status: "Published",
        links: []
    },
    {
        year: 2021,
        title: "Terrain-Relative Diver Following with Autonomous Underwater Vehicle for Coral Reef Mapping",
        authors: "Antervedi, P., Chen, Z., Anand, H., Martin, R., Arrowsmith, R., & Das, J. (2021)",
        journal: "2021 IEEE 17th International Conference on Automation Science and Engineering (pp. 2307-2312). IEEE",
        abstract: "Autonomous underwater vehicle system for terrain-relative diver following in coral reef mapping applications.",
        categories: ["conference"],
        status: "Published",
        links: []
    },
    {
        year: 2021,
        title: "OpenUAV Cloud Testbed: a Collaborative Design Studio for Field Robotics",
        authors: "Anand, H., Rees, S. A., Chen, Z., Poruthukaran, A. J., Bearman, S., Antervedi, L. G. P., & Das, J. (2021)",
        journal: "2021 IEEE 17th International Conference on Automation Science and Engineering (pp. 724-731). IEEE. (Best Application Paper Award Finalists)",
        abstract: "Collaborative cloud testbed platform for field robotics research and development.",
        categories: ["conference"],
        status: "Published",
        links: []
    },
    {
        year: 2021,
        title: "Data-Driven Approaches for Tornado Damage Estimation with Unpiloted Aerial Systems",
        authors: "Chen, Z., Wagner, M., Das, J., Doe, R. K., & Cerveny, R. S. (2021)",
        journal: "Remote Sensing, 13(9), 1669",
        abstract: "Data-driven machine learning approaches for estimating tornado damage using unpiloted aerial systems.",
        categories: ["journal"],
        status: "Published",
        links: []
    },
    {
        year: 2020,
        title: "Geomorphological analysis using unpiloted aircraft systems, structure from motion, and deep learning",
        authors: "Chen, Z., Scott, T. R., Bearman, S., Anand, H., Keating, D., Scott, C., Arrowsmith, R., & Das, J. (2020)",
        journal: "2020 IEEE/RSJ International Conference on Intelligent Robots and Systems (pp. 1276-1283). IEEE",
        abstract: "Integration of UAS, structure from motion, and deep learning for geomorphological analysis.",
        categories: ["conference"],
        status: "Published",
        links: []
    },
    {
        year: 2019,
        title: "Unpiloted aerial systems (UASs) application for tornado damage surveys: Benefits and procedures",
        authors: "Wagner, M., Doe, R. K., Johnson, A., Chen, Z., Das, J., & Cerveny, R. S. (2019)",
        journal: "Bulletin of the American Meteorological Society, 100(12), 2405-2409",
        abstract: "Benefits and procedures for using unpiloted aerial systems in tornado damage surveys.",
        categories: ["journal"],
        status: "Published",
        links: []
    },
    
    // Contributed Papers and Abstracts
    {
        year: 2023,
        title: "Segmenting geologic landforms using zero-shot deep learning and lidar topography",
        authors: "Chen, Z., Scott, C., Schwarz, M., Johnstone S., Crosby C, & Arrowsmith, R. (2023)",
        journal: "AGU Fall Meeting 2023",
        abstract: "Application of zero-shot deep learning techniques to segment geologic landforms using lidar topography data.",
        categories: ["contributed"],
        status: "Conference Abstract",
        links: []
    },
    {
        year: 2023,
        title: "Studying Overturning and Large Displacement Processes of Precariously Balanced Rocks for Ground Motion Estimation",
        authors: "Chen, Z., Arrowsmith, R., Das, J., Wittich, C., Madugo, C., & Kottke A. (2023)",
        journal: "Poster Presentation at 2023 SCEC Annual Meeting",
        abstract: "Investigation of overturning and large displacement processes in precariously balanced rocks for seismic ground motion estimation.",
        categories: ["contributed"],
        status: "Poster",
        links: []
    },
    {
        year: 2022,
        title: "Shakebot: a low-cost, open-source shake table for structural seismology research",
        authors: "Chen, Z., Keating, D., Shethwala, Y., Pandian Saravanakumaran A., Arrowsmith, R., Das, J., Madugo, C., & Kottke A. (2022)",
        journal: "Poster Presentation at 2022 SCEC Annual Meeting",
        abstract: "Development of a low-cost, open-source shake table for structural seismology research applications.",
        categories: ["contributed"],
        status: "Poster",
        links: []
    },
    {
        year: 2022,
        title: "Leveraging Robotics and AI for Geoscience: Rock Search, Mapping, and Dynamics Analysis",
        authors: "Chen, Z., Das, J., & Arrowsmith, R. (2022)",
        journal: "2022 SAGE/GAGE Community Science Workshop",
        abstract: "Application of robotics and AI technologies for geoscience research including rock search, mapping, and dynamics analysis.",
        categories: ["contributed"],
        status: "Workshop",
        links: []
    },
    {
        year: 2022,
        title: "High-resolution Tornado Damage Estimation Using UAV and Machine Learning",
        authors: "Chen, Z., Das, J., Wagner, M, & Arrowsmith, R. (2022)",
        journal: "ICRA Workshop on Robotics for Climate Change",
        abstract: "High-resolution tornado damage estimation using unmanned aerial vehicles and machine learning techniques.",
        categories: ["contributed"],
        status: "Workshop",
        links: []
    },
    {
        year: 2021,
        title: "Machine Learning Approach to Wildfire Effects on Debris Flow Hazard in Tonto, Arizona",
        authors: "Keating, D., Chen, Z., Das, J., & Arrowsmith, R. (2021)",
        journal: "AGU Fall Meeting 2021",
        abstract: "Machine learning approach to assess wildfire effects on debris flow hazards in Tonto, Arizona.",
        categories: ["contributed"],
        status: "Conference Abstract",
        links: []
    },
    {
        year: 2021,
        title: "Autonomous 3D Rock Detection for Geomorphology",
        authors: "Chen, Z., Arrowsmith, R., & Das, J. (2021)",
        journal: "AGU Fall Meeting 2021",
        abstract: "Development of autonomous 3D rock detection methods for geomorphological research applications.",
        categories: ["contributed"],
        status: "Conference Abstract",
        links: []
    },
    {
        year: 2021,
        title: "Artificial Intelligence Assists in the Estimation of Hypolith Distribution in the Namib Desert",
        authors: "Collins, C., Anand, H., Chen, Z., Aparecido, L. M. T., Das, J., & Throop, H. (2021)",
        journal: "AGU Fall Meeting 2021",
        abstract: "AI-assisted estimation of hypolith distribution patterns in the Namib Desert ecosystem.",
        categories: ["contributed"],
        status: "Conference Abstract",
        links: []
    },
    {
        year: 2021,
        title: "Virtual Shake Robot: Dynamics Simulation of Precariously Balanced Rocks for Hazard Analysis",
        authors: "Chen, Z., Keating, D., Das, J., Wittich, C., & Arrowsmith, R. (2021)",
        journal: "Poster Presentation at 2021 SCEC Annual Meeting",
        abstract: "Virtual shake robot for dynamics simulation of precariously balanced rocks in seismic hazard analysis.",
        categories: ["contributed"],
        status: "Poster",
        links: []
    },
    {
        year: 2020,
        title: "Robotics and AI weave surface process narratives from rock geomorphology",
        authors: "Das, J., Chen, Z., Scott, T., Scott, C., Keating, D., & Arrowsmith, R. (2020)",
        journal: "AGU Fall Meeting Abstracts",
        abstract: "Integration of robotics and AI to understand surface processes through rock geomorphology analysis.",
        categories: ["contributed"],
        status: "Conference Abstract",
        links: []
    },
    {
        year: 2020,
        title: "Extreme Discharges and Thresholds of Boulder Mobility in Steep Mountainous Streams on Maui, Hawai'i",
        authors: "Raming, L. W., Chen, Z., Keating, D., Whipple, K. X., Yager, E., Strauch, A. M., & Das, J. (2020)",
        journal: "AGU Fall Meeting Abstracts",
        abstract: "Study of extreme discharge events and boulder mobility thresholds in steep mountainous streams on Maui, Hawai'i.",
        categories: ["contributed"],
        status: "Conference Abstract",
        links: []
    },
    {
        year: 2020,
        title: "Localization and Mapping of Sparse Geologic Features with Unpiloted Aircraft Systems",
        authors: "Chen, Z., Bearman, S., Arrowsmith, J. R., & Das, J. (2020)",
        journal: "RSS Workshop on Robots in the Wild",
        abstract: "Localization and mapping techniques for sparse geologic features using unpiloted aircraft systems.",
        categories: ["contributed"],
        status: "Workshop",
        links: []
    },
    {
        year: 2019,
        title: "Towards Automated Monitoring of Animal Movement using Camera Networks and AI",
        authors: "Bearman, S., Chen, Z., Anand, H., Sprague, S., Gagnon, J., & Das, J. (2019)",
        journal: "RSS Workshop on Robots in the Wild",
        abstract: "Development of automated animal movement monitoring using camera networks and artificial intelligence.",
        categories: ["contributed"],
        status: "Workshop",
        links: []
    },
    {
        year: 2018,
        title: "Explain by Goal Augmentation: Explanation Generation as Inverse Planning",
        authors: "Chen, Z., & Zhang, Y. (2018)",
        journal: "RSS Workshop on Adversarial Robotics",
        abstract: "Novel approach to explanation generation through goal augmentation and inverse planning methods.",
        categories: ["contributed"],
        status: "Workshop",
        links: []
    },
    
    // Theses
    {
        year: 2022,
        title: "Automated Geoscience with Robotics and Machine Learning: A New Hammer of Rock Detection, Mapping, and Dynamics Analysis",
        authors: "Chen, Z. (2022)",
        journal: "Arizona State University",
        abstract: "Ph.D. dissertation on automated geoscience applications using robotics and machine learning for rock detection, mapping, and dynamics analysis.",
        categories: ["thesis"],
        status: "Ph.D. Dissertation",
        links: []
    },
    {
        year: 2017,
        title: "Deep-learning Approaches to Object Recognition from 3D Data",
        authors: "Chen, Z. (2017)",
        journal: "Case Western Reserve University",
        abstract: "M.S. thesis on deep learning approaches for object recognition from 3D data.",
        categories: ["thesis"],
        status: "M.S. Thesis",
        links: []
    }
];

document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile navigation toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    const mobileNavLinks = document.querySelectorAll('.nav-menu a');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar background on scroll
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Tab functionality for publications page
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabBtns.length > 0 && tabContents.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked button
                btn.classList.add('active');

                // Show corresponding content
                const tabId = btn.getAttribute('data-tab');
                const targetContent = document.getElementById(tabId);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    // Category tabs for news page with dynamic filtering and sorting
    const categoryBtns = document.querySelectorAll('.category-btn');
    const allNewsItems = document.querySelectorAll('#all .news-card');

    // Only run news filtering if we're on the news page
    if (categoryBtns.length > 0 && allNewsItems.length > 0) {

        function parseDateFromNewsCard(newsCard) {
        const dateElement = newsCard.querySelector('.news-date');
        if (!dateElement) return new Date(0); // Default to earliest date if no date found
        
        const dateText = dateElement.textContent.trim();
        
        // Handle different date formats
        if (dateText.includes('2025')) {
            if (dateText.includes('Summer')) return new Date(2025, 5, 1); // June 2025
            if (dateText.includes('March')) return new Date(2025, 2, 1); // March 2025
            return new Date(2025, 0, 1); // Default to January 2025
        }
        
        if (dateText.includes('2024')) {
            if (dateText.includes('Summer')) return new Date(2024, 5, 1); // June 2024
            return new Date(2024, 0, 1); // Default to January 2024
        }
        
        if (dateText.includes('2023')) {
            if (dateText.includes('November')) return new Date(2023, 10, 1); // November 2023
            if (dateText.includes('October')) return new Date(2023, 9, 1); // October 2023
            return new Date(2023, 0, 1); // Default to January 2023
        }
        
        if (dateText.includes('2022')) {
            if (dateText.includes('October')) return new Date(2022, 9, 1); // October 2022
            if (dateText.includes('May')) return new Date(2022, 4, 1); // May 2022
            return new Date(2022, 0, 1); // Default to January 2022
        }
        
        if (dateText.includes('2021')) {
            if (dateText.includes('December')) return new Date(2021, 11, 1); // December 2021
            return new Date(2021, 0, 1); // Default to January 2021
        }
        
        if (dateText.includes('2020')) return new Date(2020, 0, 1);
        if (dateText.includes('2017')) return new Date(2017, 0, 1);
        if (dateText.includes('2015')) return new Date(2015, 0, 1);
        if (dateText.includes('2014')) return new Date(2014, 0, 1);
        
        // For relative dates like "Recent"
        if (dateText.toLowerCase().includes('recent')) return new Date(); // Current date
        
        return new Date(0); // Default to earliest date
    }

    function sortNewsItemsByDate(items) {
        return Array.from(items).sort((a, b) => {
            const dateA = parseDateFromNewsCard(a);
            const dateB = parseDateFromNewsCard(b);
            return dateB - dateA; // Sort newest first
        });
    }

    function filterNewsByCategory(category) {
        // Clear all category grids first
        const categoryGrids = ['outreach-grid', 'media-grid', 'publications-grid', 'talks-grid', 'awards-grid', 'software-grid'];
        categoryGrids.forEach(gridId => {
            const grid = document.getElementById(gridId);
            if (grid) {
                grid.innerHTML = '';
            }
        });

        if (category === 'all') {
            // Sort and display all news items in the main grid
            const sortedItems = sortNewsItemsByDate(allNewsItems);
            const newsGrid = document.querySelector('#all .news-grid');
            
            // Clear and re-append sorted items
            newsGrid.innerHTML = '';
            sortedItems.forEach(item => {
                newsGrid.appendChild(item);
                item.style.display = 'block';
            });
        } else {
            // Filter items by category, sort them, and clone to appropriate grid
            const filteredItems = Array.from(allNewsItems).filter(item => 
                item.classList.contains(category)
            );
            const sortedItems = sortNewsItemsByDate(filteredItems);
            const targetGrid = document.getElementById(category + '-grid');
            
            if (targetGrid) {
                sortedItems.forEach(item => {
                    const clonedItem = item.cloneNode(true);
                    targetGrid.appendChild(clonedItem);
                });
            }
        }
    }

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            categoryBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.category-content').forEach(content => content.classList.remove('active'));

            // Add active class to clicked button
            btn.classList.add('active');

            // Get category and filter news
            const category = btn.getAttribute('data-category');
            document.getElementById(category).classList.add('active');
            
            // Apply filtering and sorting
            filterNewsByCategory(category);
        });
    });

        // Initialize with sorted 'all' category on page load
        if (categoryBtns.length > 0) {
            // Sort the initial news items on page load
            filterNewsByCategory('all');
        }
    }

    // Contact form handling
    const contactForm = document.querySelector('.contact-form-element');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            
            // Basic validation
            if (!name || !email || !subject || !message) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }
            
            // Simulate form submission (replace with actual form handling)
            alert('Thank you for your message! I will get back to you soon.');
            this.reset();
        });
    }

    // Newsletter form handling
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            
            if (!email) {
                alert('Please enter your email address.');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }
            
            alert('Thank you for subscribing to my newsletter!');
            this.reset();
        });
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.research-card, .news-item, .stat-item, .project-card, .publication-item, .dataset-card, .repo-card, .talk-card, .course-card, .lecture-card, .presentation-card, .media-card, .topic-card, .award-card, .student-project-card, .resource-card, .profile-card, .opportunity-card, .contact-card, .press-resource');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Update publication counts dynamically
    function updatePublicationCounts() {
        const journalCount = document.querySelectorAll('#journals .publication-item').length;
        const conferenceCount = document.querySelectorAll('#conferences .publication-item').length;
        const preprintCount = document.querySelectorAll('#preprints .publication-item').length;
        const bookCount = document.querySelectorAll('#books .publication-item').length;
        const totalCount = journalCount + conferenceCount + preprintCount + bookCount;

        // Update stats on publications page
        const totalPubStat = document.querySelector('.github-stats .stat-card:first-child .stat-number');
        const journalStat = document.querySelector('.github-stats .stat-card:nth-child(2) .stat-number');
        const conferenceStat = document.querySelector('.github-stats .stat-card:nth-child(3) .stat-number');
        
        if (totalPubStat) totalPubStat.textContent = totalCount;
        if (journalStat) journalStat.textContent = journalCount;
        if (conferenceStat) conferenceStat.textContent = conferenceCount;
    }

    // Update project counts
    function updateProjectCounts() {
        const currentProjects = document.querySelectorAll('.project-card.current').length;
        const completedProjects = document.querySelectorAll('.project-card.completed').length;
        const totalProjects = currentProjects + completedProjects;

        // Update stats on home page
        const projectsStat = document.querySelector('.about-stats .stat-item:nth-child(2) .stat-number');
        if (projectsStat) projectsStat.textContent = totalProjects;
    }

    // Update publication counts on home page
    function updateHomePageCounts() {
        const totalPublications = document.querySelectorAll('.publication-item').length;
        const publicationsStat = document.querySelector('.about-stats .stat-item:first-child .stat-number');
        if (publicationsStat) publicationsStat.textContent = totalPublications;
    }

    // Call update functions
    updatePublicationCounts();
    updateProjectCounts();
    updateHomePageCounts();

    // Mobile navigation functionality is now handled in CSS

    // Lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Smooth reveal animations for sections
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.1
    });

    const sections = document.querySelectorAll('section');
    sections.forEach(section => sectionObserver.observe(section));

    // Add CSS for section animations
    const animationStyle = document.createElement('style');
    animationStyle.textContent = `
        section {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s ease, transform 0.8s ease;
        }
        
        section.revealed {
            opacity: 1;
            transform: translateY(0);
        }
        
        .lazy {
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .lazy.loaded {
            opacity: 1;
        }
    `;
    document.head.appendChild(animationStyle);

    // Publication Management System
    function initializePublications() {
        // Check if we're on the publications page by looking for the publications container
        const container = document.getElementById('publications-container');
        const publicationStats = document.querySelector('.github-stats') && document.getElementById('publications-container');
        
        // Return if neither the container nor stats section exist (not on publications page)
        if (!container && !publicationStats) return;

        // Update statistics but don't render publications by default
        updatePublicationStats();
        setupStatCardFunctionality();
        
        // Hide publications container initially
        if (container) {
            container.style.display = 'none';
        }
    }

    function renderPublications(filter = 'all') {
        const container = document.getElementById('publications-container');
        if (!container) return;

        // Map tab filters to category names
        const filterMap = {
            'journals': 'journal',
            'conferences': 'conference', 
            'preprints': 'preprint',
            'contributed': 'contributed',
            'theses': 'thesis'
        };

        // Filter publications based on the selected tab
        let filteredPublications = publicationsData;
        if (filter !== 'all') {
            const categoryFilter = filterMap[filter] || filter;
            filteredPublications = publicationsData.filter(pub => pub.categories.includes(categoryFilter));
        }

        // Group publications by year
        const publicationsByYear = {};
        filteredPublications.forEach(pub => {
            if (!publicationsByYear[pub.year]) {
                publicationsByYear[pub.year] = [];
            }
            publicationsByYear[pub.year].push(pub);
        });

        // Sort years in descending order
        const sortedYears = Object.keys(publicationsByYear).sort((a, b) => b - a);

        // Generate HTML
        let html = '<div class="tab-content active">';
        
        sortedYears.forEach(year => {
            let yearTitle = year;
            if (year === '2025' || year === '2026') {
                yearTitle = `${year} (In Preparation)`;
            }
            html += `<div class="year-group">
                        <h2 class="year-title">${yearTitle}</h2>`;
            
            publicationsByYear[year].forEach(pub => {
                html += generatePublicationHTML(pub);
            });
            
            html += '</div>';
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // Ensure the container is visible (add any necessary classes)
        container.style.display = 'block';
        container.style.opacity = '1';
    }

    function generatePublicationHTML(pub) {
        const statusClass = pub.categories[0]; // Use first category for CSS class
        const linksHTML = pub.links && pub.links.length > 0 ? 
            `<div class="pub-links">
                ${pub.links.map(link => 
                    `<a href="${link.url}" class="pub-link"><i class="${link.icon}"></i> ${link.type}</a>`
                ).join('')}
            </div>` : '';

        const abstractHTML = pub.abstract ? 
            `<p class="abstract">${pub.abstract}</p>` : '';

        return `
            <div class="publication-item">
                <div class="pub-type ${statusClass}">${pub.status}</div>
                <div class="pub-content">
                    <h3>${pub.title}</h3>
                    <p class="authors">${pub.authors}</p>
                    <p class="journal">${pub.journal}</p>
                    ${abstractHTML}
                    ${linksHTML}
                </div>
            </div>
        `;
    }

    function setupStatCardFunctionality() {
        const statCards = document.querySelectorAll('.stat-card.clickable');
        
        statCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove active class from all cards
                statCards.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked card
                card.classList.add('active');
                
                // Get filter and render publications
                const filter = card.getAttribute('data-filter');
                renderPublications(filter);
                
                // Show the publications container
                const container = document.getElementById('publications-container');
                if (container) {
                    container.style.display = 'block';
                    container.style.opacity = '1';
                }
            });
        });
    }

    function updatePublicationStats() {
        // Count publications by category
        let counts = {
            total: publicationsData.length,
            journal: 0,
            conference: 0,
            preprint: 0,
            contributed: 0,
            thesis: 0
        };

        publicationsData.forEach(pub => {
            pub.categories.forEach(category => {
                if (counts[category] !== undefined) {
                    counts[category]++;
                }
            });
        });

        // Update the statistics in the DOM
        const totalElement = document.getElementById('total-count');
        const journalElement = document.getElementById('journal-count');
        const conferenceElement = document.getElementById('conference-count');
        const preprintElement = document.getElementById('preprint-count');
        const contributedElement = document.getElementById('contributed-count');
        const thesisElement = document.getElementById('thesis-count');

        if (totalElement) totalElement.textContent = counts.total;
        if (journalElement) journalElement.textContent = counts.journal;
        if (conferenceElement) conferenceElement.textContent = counts.conference;
        if (preprintElement) preprintElement.textContent = counts.preprint;
        if (contributedElement) contributedElement.textContent = counts.contributed;
        if (thesisElement) thesisElement.textContent = counts.thesis;

        // Animate the numbers
        animateCounters();
    }

    // Animate counter numbers
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        counters.forEach(counter => {
            const target = parseInt(counter.textContent);
            const increment = target / 30; // Animation duration
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                counter.textContent = Math.floor(current);
                
                if (current >= target) {
                    counter.textContent = target;
                    clearInterval(timer);
                }
            }, 50);
        });
    }

    // Initialize publication statistics
    initializePublications();

    // Teaching Gallery Slider
    initGallerySlider();
});

// Also try to initialize publications when the page is fully loaded
window.addEventListener('load', function() {
    initializePublications();
});

// And try immediately if document is already ready
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializePublications();
}

function initGallerySlider() {
    const track = document.getElementById('galleryTrack');
    const slides = document.querySelectorAll('.gallery-slide');
    const prevBtn = document.getElementById('galleryPrev');
    const nextBtn = document.getElementById('galleryNext');
    const dots = document.querySelectorAll('.dot');
    
    if (!track || slides.length === 0) return;
    
    let currentSlide = 0;
    let isAnimating = false;
    
    // Touch/swipe variables
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    function updateSlider() {
        if (isAnimating) return;
        isAnimating = true;
        
        const translateX = -currentSlide * 100;
        track.style.transform = `translateX(${translateX}%)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
        
        setTimeout(() => {
            isAnimating = false;
        }, 500);
    }
    
    function nextSlide() {
        if (currentSlide < slides.length - 1) {
            currentSlide++;
        } else {
            currentSlide = 0; // Loop back to first slide
        }
        updateSlider();
    }
    
    function prevSlide() {
        if (currentSlide > 0) {
            currentSlide--;
        } else {
            currentSlide = slides.length - 1; // Loop to last slide
        }
        updateSlider();
    }
    
    function goToSlide(slideIndex) {
        currentSlide = slideIndex;
        updateSlider();
    }
    
    // Event listeners for navigation buttons
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }
    
    // Event listeners for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });
    
    // Touch/swipe support
    track.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        track.style.transition = 'none';
    });
    
    track.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.touches[0].clientX;
        const diffX = startX - currentX;
        const translateX = -currentSlide * 100 - (diffX / track.offsetWidth) * 100;
        track.style.transform = `translateX(${translateX}%)`;
    });
    
    track.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        track.style.transition = 'transform 0.5s ease';
        
        const diffX = startX - currentX;
        const threshold = 50; // Minimum swipe distance
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        } else {
            updateSlider(); // Snap back to current slide
        }
    });
    
    // Mouse drag support for desktop
    let isMouseDown = false;
    
    track.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        isMouseDown = true;
        track.style.transition = 'none';
        track.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    track.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        e.preventDefault();
        currentX = e.clientX;
        const diffX = startX - currentX;
        const translateX = -currentSlide * 100 - (diffX / track.offsetWidth) * 100;
        track.style.transform = `translateX(${translateX}%)`;
    });
    
    track.addEventListener('mouseup', () => {
        if (!isMouseDown) return;
        isMouseDown = false;
        track.style.transition = 'transform 0.5s ease';
        track.style.cursor = 'grab';
        
        const diffX = startX - currentX;
        const threshold = 50;
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        } else {
            updateSlider();
        }
    });
    
    track.addEventListener('mouseleave', () => {
        if (isMouseDown) {
            isMouseDown = false;
            track.style.transition = 'transform 0.5s ease';
            track.style.cursor = 'grab';
            updateSlider();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
        }
    });
    
    // Auto-play (optional - uncomment to enable)
    // setInterval(nextSlide, 5000);
    
    // Initialize
    updateSlider();
}

// Dynamic Statistics Update for Index Page
async function updateIndexPageStats() {
    try {
        // Hardcoded publications count to avoid GitHub Pages CORS issues
        const publicationsCount = 31; // Based on publicationsData array count
        
        // Function to count projects
        const projectsCount = await countProjects();
        
        // Hardcoded grants total to avoid GitHub Pages CORS issues
        const grantsTotal = 456; // Calculated from projects.html: $455,757 total
        
        // Update the statistics display with animation
        updateStatWithAnimation('Publications', publicationsCount);
        updateStatWithAnimation('Active Projects', projectsCount);
        updateStatWithAnimation('Research Grants', `$${grantsTotal}K+`);
        
    } catch (error) {
        console.error('Error updating index page stats:', error);
    }
}

// Count projects from projects page
async function countProjects() {
    try {
        const response = await fetch('projects.html');
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Count project items
        const projectItems = doc.querySelectorAll('.project-item');
        return projectItems.length;
    } catch (error) {
        console.error('Error counting projects:', error);
        return 5; // Fallback value
    }
}

// Update stat with animation
function updateStatWithAnimation(statName, value) {
    const statItems = document.querySelectorAll('.about-stats .stat-item');
    
    statItems.forEach(item => {
        const h3 = item.querySelector('h3');
        if (h3 && h3.textContent.includes(statName)) {
            const numberElement = item.querySelector('.stat-number');
            if (numberElement) {
                // Animate number counting if it's numeric
                if (typeof value === 'number') {
                    animateNumber(numberElement, 0, value, 1500);
                } else {
                    // For non-numeric values (like "$500K+")
                    numberElement.textContent = value;
                }
            }
        }
    });
}

// Animate number counting
function animateNumber(element, start, end, duration) {
    const startTime = Date.now();
    const range = end - start;
    
    function updateNumber() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Use easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(start + (range * easeOutQuart));
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    updateNumber();
}

// Enhanced GitHub stats display for datasets page
function updateGitHubStatsDisplay(stats) {
    const statNumbers = document.querySelectorAll('.stat-number');
    const statLabels = ['GitHub Repositories', 'Stars', 'Forks', 'Organizations', 'Research Datasets'];
    const values = [stats.repositories, stats.stars, stats.forks, stats.organizations, 5];
    
    statNumbers.forEach((numberElement, index) => {
        if (index < values.length) {
            animateNumber(numberElement, 0, values[index], 1500);
        }
    });
}

// Dynamic News Update for Index Page
async function updateRecentNews() {
    try {
        const response = await fetch('news.html');
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Get all news cards
        const newsCards = doc.querySelectorAll('.news-card');
        
        // Parse and sort news items by date
        const newsItems = Array.from(newsCards).map(card => {
            const date = card.querySelector('.news-date')?.textContent.trim() || '';
            const title = card.querySelector('h3')?.textContent.trim() || '';
            const excerpt = card.querySelector('.news-excerpt')?.textContent.trim() || '';
            const link = card.querySelector('.news-link')?.href || 'news.html';
            const linkText = card.querySelector('.news-link')?.textContent.trim() || 'Read More';
            
            return {
                date,
                title,
                excerpt,
                link,
                linkText,
                dateValue: parseDateForSorting(date)
            };
        }).filter(item => item.title); // Filter out empty items
        
        // Sort by date (newest first)
        newsItems.sort((a, b) => b.dateValue - a.dateValue);
        
        // Take the three most recent
        const recentNews = newsItems.slice(0, 3);
        
        // Update the Recent Highlights section
        updateRecentNewsDisplay(recentNews);
        
    } catch (error) {
        console.error('Error updating recent news:', error);
    }
}

// Parse date strings for sorting
function parseDateForSorting(dateStr) {
    if (!dateStr) return new Date(0);
    
    // Handle different date formats
    const currentYear = new Date().getFullYear();
    
    if (dateStr.includes('2025')) {
        if (dateStr.toLowerCase().includes('summer')) return new Date(2025, 5, 1); // June 2025
        if (dateStr.toLowerCase().includes('march')) return new Date(2025, 2, 1); // March 2025
        return new Date(2025, 0, 1); // Default to January 2025
    }
    
    if (dateStr.includes('2024')) {
        if (dateStr.toLowerCase().includes('summer')) return new Date(2024, 5, 1); // June 2024
        return new Date(2024, 0, 1); // Default to January 2024
    }
    
    if (dateStr.includes('2023')) {
        if (dateStr.toLowerCase().includes('november')) return new Date(2023, 10, 1); // November 2023
        if (dateStr.toLowerCase().includes('october')) return new Date(2023, 9, 1); // October 2023
        return new Date(2023, 0, 1); // Default to January 2023
    }
    
    if (dateStr.includes('2022')) {
        if (dateStr.toLowerCase().includes('october')) return new Date(2022, 9, 1); // October 2022
        if (dateStr.toLowerCase().includes('may')) return new Date(2022, 4, 1); // May 2022
        return new Date(2022, 0, 1); // Default to January 2022
    }
    
    if (dateStr.includes('2021')) return new Date(2021, 0, 1);
    if (dateStr.includes('2020')) return new Date(2020, 0, 1);
    if (dateStr.includes('2017')) return new Date(2017, 0, 1);
    if (dateStr.includes('2015')) return new Date(2015, 0, 1);
    if (dateStr.includes('2014')) return new Date(2014, 0, 1);
    
    // For year-only dates, try to extract the year
    const yearMatch = dateStr.match(/\b(20\d{2})\b/);
    if (yearMatch) {
        return new Date(parseInt(yearMatch[1]), 0, 1);
    }
    
    return new Date(0); // Default to earliest date
}

// Update the Recent Highlights section with new news items
function updateRecentNewsDisplay(newsItems) {
    const newsGrid = document.querySelector('.recent-news .news-grid');
    if (!newsGrid || newsItems.length === 0) return;
    
    // Clear existing content
    newsGrid.innerHTML = '';
    
    // Add new news items
    newsItems.forEach(item => {
        const newsElement = document.createElement('div');
        newsElement.className = 'news-item';
        
        newsElement.innerHTML = `
            <div class="news-date">${item.date}</div>
            <h3>${item.title}</h3>
            <p>${item.excerpt}</p>
            <a href="${item.link}" class="news-link">${item.linkText}</a>
        `;
        
        newsGrid.appendChild(newsElement);
    });
}

// Initialize stats update when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the index page
    if (document.querySelector('.about-stats') && document.querySelector('.hero')) {
        // Delay the update to allow page to load completely
        setTimeout(updateIndexPageStats, 1000);
        
        // Update recent news if we're on the index page
        if (document.querySelector('.recent-news')) {
            setTimeout(updateRecentNews, 1200);
        }
    }
    
    // Only fetch GitHub stats if we're on the datasets page
    if (document.querySelector('.github-stats') && document.querySelector('.featured-repos')) {
        fetchGitHubStats();
    }
});
