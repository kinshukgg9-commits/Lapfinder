// LapFinder JS Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // Global elements
  const tabs = document.querySelectorAll('.nav-tab');
  const panels = document.querySelectorAll('.dashboard-panel');
  
  // Initialize state
  let selectedCompareLaptops = [];

  // Tab switching logic
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // Update active nav-tab styling
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update active panel with transition
      panels.forEach(panel => {
        panel.classList.remove('active');
        panel.style.display = 'none';
      });
      
      const activePanel = document.getElementById(targetTab);
      activePanel.style.display = 'block';
      // force browser reflow for CSS transitions
      activePanel.offsetHeight; 
      activePanel.classList.add('active');

      // Sync state if switching tabs (e.g., re-render comparison if active)
      if (targetTab === 'compare-dashboard') {
        renderComparison();
      }
    });
  });

  // ==========================================
  // DASHBOARD 1: Model Search & Similarity
  // ==========================================
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const suggestionsBox = document.getElementById('search-suggestions');
  const searchError = document.getElementById('search-error');
  const detailSection = document.getElementById('laptop-detail-section');
  const similarityPillsList = document.getElementById('similarity-pills-list');

  // Input events
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    
    if (query.length > 0) {
      clearSearchBtn.style.display = 'block';
      showSuggestions(query);
    } else {
      clearSearchBtn.style.display = 'none';
      suggestionsBox.style.display = 'none';
    }
  });

  searchInput.addEventListener('focus', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length > 0) {
      showSuggestions(query);
    }
  });

  // Clear search button
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    suggestionsBox.style.display = 'none';
    searchError.style.display = 'none';
    searchInput.focus();
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      suggestionsBox.style.display = 'none';
    }
  });

  // Trigger search on Enter key
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        // Find exact match or closest match
        const match = LAPTOPS.find(l => l.model.toLowerCase() === query.toLowerCase());
        if (match) {
          selectLaptop(match);
        } else {
          // Soft error
          showSearchError(query);
        }
      }
    }
  });

  // Show suggestions in dropdown
  function showSuggestions(query) {
    // Filter models
    const matches = LAPTOPS.filter(l => 
      l.model.toLowerCase().includes(query) || 
      l.brand.toLowerCase().includes(query) ||
      l.series.toLowerCase().includes(query)
    ).slice(0, 10); // Limit to top 10

    if (matches.length > 0) {
      suggestionsBox.innerHTML = '';
      matches.forEach(laptop => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
          <span class="suggestion-model">${laptop.model}</span>
          <span class="suggestion-details">${laptop.brand} • ${laptop.processor_model} • ${laptop.ram} RAM • ${laptop.storage_summary}</span>
        `;
        item.addEventListener('click', () => {
          selectLaptop(laptop);
        });
        suggestionsBox.appendChild(item);
      });
      suggestionsBox.style.display = 'block';
      searchError.style.display = 'none';
    } else {
      suggestionsBox.style.display = 'none';
    }
  }

  // Display laptop details
  function selectLaptop(laptop) {
    searchInput.value = laptop.model;
    clearSearchBtn.style.display = 'block';
    suggestionsBox.style.display = 'none';
    searchError.style.display = 'none';

    // Populate specs
    document.getElementById('detail-brand').textContent = laptop.brand;
    document.getElementById('detail-model').textContent = laptop.model;
    document.getElementById('detail-series').textContent = laptop.series || "Standard Series";
    document.getElementById('detail-part').textContent = `Part No: ${laptop.part_no || 'Unmentioned'}`;
    document.getElementById('detail-buy-link').href = laptop.link;

    // Card details
    document.getElementById('spec-cpu').textContent = laptop.processor_model || 'Unmentioned';
    document.getElementById('spec-cores').textContent = `${laptop.processor_cores} Cores`;
    document.getElementById('spec-cpu-type').textContent = laptop.processor_type || 'Unmentioned';
    document.getElementById('spec-ram').textContent = `${laptop.ram} ${laptop.ram_type}`;

    document.getElementById('spec-ssd-type').textContent = laptop.ssd_type || 'No SSD';
    document.getElementById('spec-storage').textContent = laptop.storage_summary;
    document.getElementById('spec-gpu').textContent = laptop.graphics_chipset || 'Integrated Graphics';
    document.getElementById('spec-gpu-memory').textContent = `${laptop.graphics_memory} (${laptop.graphics_accessibility})`;

    document.getElementById('spec-display-size').textContent = `${laptop.display_size}"`;
    document.getElementById('spec-resolution').textContent = laptop.display_resolution || 'Unmentioned';
    document.getElementById('spec-panel').textContent = laptop.display_type || 'Standard LCD';
    document.getElementById('spec-touch').textContent = laptop.touch_screen || 'No';

    document.getElementById('spec-os').textContent = laptop.os || 'Unmentioned';
    document.getElementById('spec-weight').textContent = `${laptop.weight} Kg (${laptop.weight_raw})`;
    document.getElementById('spec-color').textContent = laptop.color || 'Unmentioned';
    document.getElementById('spec-warranty').textContent = laptop.warranty || 'Unmentioned';

    // Show details
    detailSection.style.display = 'block';
    
    // Generate similarity pills
    generateSimilarityPills(laptop);
  }

  // Soft error toast
  function showSearchError(query) {
    detailSection.style.display = 'none';
    const errorText = document.getElementById('error-message-text');
    errorText.innerHTML = `Sorry, the model <strong>"${query}"</strong> is not registered with us. Try typing a brand name or select from the options dropdown.`;
    searchError.style.display = 'flex';
    suggestionsBox.style.display = 'none';
  }

  // Distance/Similarity score calculation
  function calculateSimilarityScore(l1, l2) {
    let score = 0;
    
    // 1. CPU Cores weight (x5)
    score += Math.abs(l1.processor_cores - l2.processor_cores) * 5;
    
    // 2. RAM Size weight (x12)
    score += Math.abs(l1.ram_numeric - l2.ram_numeric) * 12;
    
    // 3. Storage capacity weight (x0.05)
    score += Math.abs(l1.storage_numeric - l2.storage_numeric) * 0.05;
    
    // 4. Weight of laptop (x25)
    score += Math.abs(l1.weight - l2.weight) * 25;
    
    // 5. Display size weight (x15)
    score += Math.abs(l1.display_size - l2.display_size) * 15;
    
    // 6. Graphics accessibility mismatch weight (x35)
    if (l1.graphics_accessibility !== l2.graphics_accessibility) {
      score += 35;
    }
    
    // 7. Graphics memory size weight (x10)
    score += Math.abs(l1.graphics_memory_numeric - l2.graphics_memory_numeric) * 10;

    // 8. Brand match bonus (slight preference, subtract from distance if same brand)
    if (l1.brand === l2.brand) {
      score -= 5;
    }

    return score;
  }

  function generateSimilarityPills(targetLaptop) {
    similarityPillsList.innerHTML = '';
    
    // Calculate score for all other laptops
    const ranked = LAPTOPS
      .filter(l => l.model !== targetLaptop.model)
      .map(l => {
        const dist = calculateSimilarityScore(targetLaptop, l);
        // Map distance to a match percentage (clamped 0-100)
        const matchPct = Math.max(30, Math.min(99, Math.round(100 - (dist / 2))));
        return { laptop: l, score: matchPct };
      });
      
    // Sort descending by match percentage
    ranked.sort((a, b) => b.score - a.score);
    
    // Take top 4 similar laptops
    const topSimilar = ranked.slice(0, 4);
    
    topSimilar.forEach(item => {
      const pill = document.createElement('button');
      pill.className = 'similarity-pill';
      pill.innerHTML = `
        <span>${item.laptop.model}</span>
        <span class="similarity-score">${item.score}% match</span>
      `;
      pill.addEventListener('click', () => {
        selectLaptop(item.laptop);
        window.scrollTo({ top: searchInput.offsetTop - 80, behavior: 'smooth' });
      });
      similarityPillsList.appendChild(pill);
    });
  }


  // ==========================================
  // DASHBOARD 2: Compare Laptops
  // ==========================================
  const dropdownTrigger = document.getElementById('dropdown-trigger');
  const dropdownWrapper = document.closest ? dropdownTrigger.closest('.dropdown-wrapper') : document.querySelector('.dropdown-wrapper');
  const dropdownSearchInput = document.getElementById('dropdown-search-input');
  const dropdownOptionsList = document.getElementById('dropdown-options-list');
  const selectedItemsPanel = document.getElementById('selected-items-panel');
  const compareCountBadge = document.getElementById('compare-count-badge');
  const comparisonEmptyState = document.getElementById('comparison-empty-state');
  const comparisonGridContainer = document.getElementById('comparison-grid-container');

  // Open/Close Dropdown on Hover/Click
  dropdownTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownWrapper.classList.toggle('open');
    if (dropdownWrapper.classList.contains('open')) {
      dropdownSearchInput.focus();
    }
  });

  // Hover overrides to match "appears when hovered" request
  dropdownWrapper.addEventListener('mouseenter', () => {
    dropdownWrapper.classList.add('open');
    dropdownSearchInput.focus();
  });

  dropdownWrapper.addEventListener('mouseleave', () => {
    dropdownWrapper.classList.remove('open');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-wrapper')) {
      dropdownWrapper.classList.remove('open');
    }
  });

  // Filter dropdown options on search
  dropdownSearchInput.addEventListener('input', () => {
    const q = dropdownSearchInput.value.toLowerCase().trim();
    renderDropdownOptions(q);
  });

  // Initialize and render all dropdown options
  function renderDropdownOptions(filterText = '') {
    dropdownOptionsList.innerHTML = '';
    
    const filtered = LAPTOPS.filter(l => 
      l.model.toLowerCase().includes(filterText) ||
      l.brand.toLowerCase().includes(filterText)
    );

    filtered.forEach(laptop => {
      const isSelected = selectedCompareLaptops.some(l => l.model === laptop.model);
      const isMaxReached = selectedCompareLaptops.length >= 3;
      
      const option = document.createElement('div');
      option.className = `dropdown-option ${isSelected ? 'selected' : ''} ${(isMaxReached && !isSelected) ? 'disabled' : ''}`;
      option.innerHTML = `
        <span>${laptop.model} <small style="color:var(--apple-text-secondary)">(${laptop.brand})</small></span>
        <span class="checkbox-marker"></span>
      `;

      option.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isSelected) {
          // Remove from selection
          selectedCompareLaptops = selectedCompareLaptops.filter(l => l.model !== laptop.model);
          renderSelectedBadges();
          renderDropdownOptions(filterText);
          renderComparison();
        } else {
          // Add to selection if less than 3
          if (selectedCompareLaptops.length < 3) {
            selectedCompareLaptops.push(laptop);
            renderSelectedBadges();
            renderDropdownOptions(filterText);
            renderComparison();
          }
        }
      });

      dropdownOptionsList.appendChild(option);
    });
  }

  // Render selected items as tags inside the dropdown panel
  function renderSelectedBadges() {
    selectedItemsPanel.innerHTML = '';
    if (selectedCompareLaptops.length > 0) {
      selectedItemsPanel.style.display = 'flex';
      compareCountBadge.style.display = 'inline-block';
      compareCountBadge.textContent = selectedCompareLaptops.length;
      
      selectedCompareLaptops.forEach(laptop => {
        const badge = document.createElement('span');
        badge.className = 'selected-badge';
        badge.innerHTML = `
          <span>${laptop.model}</span>
          <button class="remove-selected-btn" data-model="${laptop.model}">&times;</button>
        `;
        badge.querySelector('.remove-selected-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          selectedCompareLaptops = selectedCompareLaptops.filter(l => l.model !== laptop.model);
          renderSelectedBadges();
          renderDropdownOptions(dropdownSearchInput.value);
          renderComparison();
        });
        selectedItemsPanel.appendChild(badge);
      });
    } else {
      selectedItemsPanel.style.display = 'none';
      compareCountBadge.style.display = 'none';
    }
  }

  // Render Comparison Matrix Table
  function renderComparison() {
    const len = selectedCompareLaptops.length;
    
    // Hide table and show empty state if fewer than 2 laptops selected
    if (len < 2) {
      comparisonEmptyState.style.display = 'block';
      comparisonGridContainer.style.display = 'none';
      return;
    }

    comparisonEmptyState.style.display = 'none';
    comparisonGridContainer.style.display = 'block';

    const headerRow = document.getElementById('table-header-row');
    const tableBody = document.getElementById('table-body');

    // 1. Build Header row
    headerRow.innerHTML = '<th class="sticky-col first-col">Specifications</th>';
    selectedCompareLaptops.forEach(laptop => {
      const th = document.createElement('th');
      th.innerHTML = `
        <div class="table-laptop-header">
          <h4>${laptop.model}</h4>
          <p>${laptop.brand} • ${laptop.series}</p>
          <button class="remove-col-btn" data-model="${laptop.model}">Remove</button>
        </div>
      `;
      th.querySelector('.remove-col-btn').addEventListener('click', () => {
        selectedCompareLaptops = selectedCompareLaptops.filter(l => l.model !== laptop.model);
        renderSelectedBadges();
        renderDropdownOptions(dropdownSearchInput.value);
        renderComparison();
      });
      headerRow.appendChild(th);
    });

    // List of specifications to display
    const specRows = [
      { label: "Processor Brand", key: "processor_brand" },
      { label: "Processor Model", key: "processor_model" },
      { label: "Cores", key: "processor_cores", numeric: true, higherBetter: true },
      { label: "RAM Size", key: "ram", numericVal: "ram_numeric", higherBetter: true },
      { label: "RAM Type", key: "ram_type" },
      { label: "Storage", key: "storage_summary", numericVal: "storage_numeric", higherBetter: true },
      { label: "SSD Type", key: "ssd_type" },
      { label: "HDD RPM", key: "hdd_rpm" },
      { label: "Graphics Chipset", key: "graphics_chipset" },
      { label: "Graphics Type", key: "graphics_accessibility", isGpuAccess: true },
      { label: "Graphics Memory", key: "graphics_memory", numericVal: "graphics_memory_numeric", higherBetter: true },
      { label: "Display Size", key: "display_size", numeric: true, higherBetter: true },
      { label: "Display Type", key: "display_type" },
      { label: "Display Resolution", key: "display_resolution", isRes: true },
      { label: "Touch Screen", key: "touch_screen" },
      { label: "Operating System", key: "os" },
      { label: "Color", key: "color" },
      { label: "Weight", key: "weight_raw", numericVal: "weight", higherBetter: false }, // lighter is better
      { label: "Power Adapter", key: "power_adapter" },
      { label: "Warranty", key: "warranty", numericVal: "warranty_years", higherBetter: true },
      { label: "Country of Origin", key: "country" },
      { label: "Product Link", key: "link", isLink: true }
    ];

    // Clear previous rows
    tableBody.innerHTML = '';

    // Helper to extract pixel count from resolution string (e.g. 1920x1080 -> 2073600)
    function parseResolutionPixels(resStr) {
      if (!resStr) return 0;
      const match = resStr.toLowerCase().match(/(\d+)\s*[x*]\s*(\d+)/);
      if (match) {
        return parseInt(match[1]) * parseInt(match[2]);
      }
      return 0;
    }

    // 2. Build Table Body Rows
    specRows.forEach(spec => {
      const tr = document.createElement('tr');
      
      // Spec Label Column
      const labelTd = document.createElement('td');
      labelTd.className = 'sticky-col';
      labelTd.textContent = spec.label;
      tr.appendChild(labelTd);

      // Determine the winner value among selected laptops
      let winnerValue = null;
      let values = [];

      selectedCompareLaptops.forEach(laptop => {
        let val;
        if (spec.numeric) {
          val = parseFloat(laptop[spec.key]);
        } else if (spec.numericVal) {
          val = parseFloat(laptop[spec.numericVal]);
        } else if (spec.isGpuAccess) {
          // Dedicated = 1, Integrated = 0
          val = laptop.graphics_accessibility === 'Dedicated' ? 1 : 0;
        } else if (spec.isRes) {
          val = parseResolutionPixels(laptop.display_resolution);
        }
        
        if (val !== undefined && !isNaN(val)) {
          values.push(val);
        } else {
          values.push(null);
        }
      });

      // Find winner
      if (values.length === len && values.every(v => v !== null)) {
        if (spec.higherBetter === true || spec.isGpuAccess || spec.isRes) {
          winnerValue = Math.max(...values);
        } else if (spec.higherBetter === false) { // Lighter is better
          winnerValue = Math.min(...values);
        }
      }

      // Add cells for each laptop
      selectedCompareLaptops.forEach((laptop, idx) => {
        const td = document.createElement('td');
        
        // Populate display text
        if (spec.isLink) {
          td.innerHTML = `<a href="${laptop.link}" target="_blank" class="apple-btn-secondary" style="font-size:11px; padding: 4px 10px; display:inline-block;">View on Ryans</a>`;
        } else {
          td.textContent = laptop[spec.key];
        }

        // Highlight winner spec
        let isWinner = false;
        if (winnerValue !== null) {
          let currentVal;
          if (spec.numeric) {
            currentVal = parseFloat(laptop[spec.key]);
          } else if (spec.numericVal) {
            currentVal = parseFloat(laptop[spec.numericVal]);
          } else if (spec.isGpuAccess) {
            currentVal = laptop.graphics_accessibility === 'Dedicated' ? 1 : 0;
          } else if (spec.isRes) {
            currentVal = parseResolutionPixels(laptop.display_resolution);
          }

          if (currentVal === winnerValue) {
            // Check if all values are equal. If all are identical, don't highlight any
            const allEqual = values.every(v => v === values[0]);
            if (!allEqual) {
              isWinner = true;
            }
          }
        }

        if (isWinner) {
          td.className = 'better-spec';
        }

        tr.appendChild(td);
      });

      tableBody.appendChild(tr);
    });
  }

  // Initialize dropdown options list
  renderDropdownOptions();


  // ==========================================
  // DASHBOARD 3: Personalized Recommendations
  // ==========================================
  const brandSelect = document.getElementById('filter-brand');
  const applyFiltersBtn = document.getElementById('apply-filters-btn');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const recommendationsContainer = document.getElementById('recommendations-container');
  const recommendationsList = document.getElementById('recommendations-list');
  const recommendationsEmpty = document.getElementById('recommendations-empty');

  // Load brands dynamically on start
  function loadBrands() {
    const brands = [...new Set(LAPTOPS.map(l => l.brand))].sort();
    brands.forEach(brand => {
      const opt = document.createElement('option');
      opt.value = brand;
      opt.textContent = brand;
      brandSelect.appendChild(opt);
    });
  }
  loadBrands();

  // Reset filters action
  resetFiltersBtn.addEventListener('click', () => {
    document.getElementById('filter-brand').value = '';
    document.getElementById('filter-ram').value = '';
    document.getElementById('filter-storage').value = '';
    document.getElementById('filter-cpu-brand').value = '';
    document.getElementById('filter-gpu-type').value = '';
    document.getElementById('filter-display-size').value = '';
    document.getElementById('filter-os').value = '';
    document.getElementById('filter-warranty').value = '';

    recommendationsContainer.style.display = 'none';
    recommendationsEmpty.style.display = 'block';
  });

  // Apply filters match logic
  applyFiltersBtn.addEventListener('click', () => {
    const selectedBrand = document.getElementById('filter-brand').value;
    const selectedRam = document.getElementById('filter-ram').value;
    const selectedStorage = document.getElementById('filter-storage').value;
    const selectedCpuBrand = document.getElementById('filter-cpu-brand').value;
    const selectedGpuType = document.getElementById('filter-gpu-type').value;
    const selectedDisplay = document.getElementById('filter-display-size').value;
    const selectedOs = document.getElementById('filter-os').value;
    const selectedWarranty = document.getElementById('filter-warranty').value;

    // Build array of active filters
    const activeFilters = [];
    if (selectedBrand) activeFilters.push({ key: 'brand', val: selectedBrand });
    if (selectedRam) activeFilters.push({ key: 'ram_numeric', val: parseInt(selectedRam) });
    if (selectedStorage) activeFilters.push({ key: 'storage_numeric', val: parseInt(selectedStorage) });
    if (selectedCpuBrand) activeFilters.push({ key: 'processor_brand', val: selectedCpuBrand });
    if (selectedGpuType) activeFilters.push({ key: 'graphics_accessibility', val: selectedGpuType });
    if (selectedDisplay) activeFilters.push({ key: 'display_size_range', val: selectedDisplay });
    if (selectedOs) activeFilters.push({ key: 'os', val: selectedOs });
    if (selectedWarranty) activeFilters.push({ key: 'warranty_years', val: parseInt(selectedWarranty) });

    if (activeFilters.length === 0) {
      alert("Please select at least one filter requirement!");
      return;
    }

    // Rank laptops based on match scores
    const results = LAPTOPS.map(laptop => {
      let matchPoints = 0;
      
      activeFilters.forEach(filter => {
        if (filter.key === 'display_size_range') {
          const size = laptop.display_size;
          if (filter.val === '11' && size >= 10 && size <= 12.9) matchPoints++;
          else if (filter.val === '13' && size >= 13 && size <= 14.9) matchPoints++;
          else if (filter.val === '15' && size >= 15 && size <= 15.9) matchPoints++;
          else if (filter.val === '16' && size >= 16) matchPoints++;
        }
        else if (filter.key === 'ram_numeric') {
          // RAM size matches if it's equal or higher
          if (laptop.ram_numeric >= filter.val) {
            matchPoints += (laptop.ram_numeric === filter.val) ? 1.0 : 0.8; // preferred exact, but better is okay
          }
        }
        else if (filter.key === 'storage_numeric') {
          // Storage matches if it's equal or higher
          if (laptop.storage_numeric >= filter.val) {
            matchPoints += (laptop.storage_numeric === filter.val) ? 1.0 : 0.8;
          }
        }
        else if (filter.key === 'warranty_years') {
          if (laptop.warranty_years >= filter.val) {
            matchPoints += (laptop.warranty_years === filter.val) ? 1.0 : 0.8;
          }
        }
        else {
          // Exact text match
          if (laptop[filter.key] === filter.val) {
            matchPoints++;
          }
        }
      });

      const percentage = Math.round((matchPoints / activeFilters.length) * 100);
      return { laptop, score: percentage };
    });

    // Sort by Match Score in descending order, then by model name
    results.sort((a, b) => b.score - a.score || a.laptop.model.localeCompare(b.laptop.model));

    // Limit to top 5 recommendations
    const top5 = results.slice(0, 5);

    // Render cards
    recommendationsList.innerHTML = '';
    
    top5.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = `recommendation-card rank-${idx+1}`;
      
      // Determine description text based on laptop configuration
      let desc = `${item.laptop.processor_model} CPU • ${item.laptop.ram} RAM • ${item.laptop.storage_summary}`;
      if (item.laptop.graphics_accessibility === 'Dedicated') {
        desc += ` • Dedicated ${item.laptop.graphics_chipset} (${item.laptop.graphics_memory})`;
      }

      card.innerHTML = `
        <div class="rec-info-panel">
          <span class="rec-rank-badge">RANK #${idx+1}</span>
          <h3 class="rec-title">${item.laptop.model}</h3>
          <p class="rec-desc">${desc}</p>
          <div class="rec-spec-tags">
            <span class="rec-tag">${item.laptop.brand}</span>
            <span class="rec-tag">${item.laptop.display_size} Inch</span>
            <span class="rec-tag">${item.laptop.display_resolution}</span>
            <span class="rec-tag">${item.laptop.os}</span>
            <span class="rec-tag">${item.laptop.weight} Kg</span>
            <span class="rec-tag">${item.laptop.warranty} Warranty</span>
          </div>
        </div>
        <div class="rec-score-panel">
          <div class="rec-match-score">${item.score}%</div>
          <div class="rec-match-label">Match Score</div>
          <button class="view-rec-btn" data-model="${item.laptop.model}">View Specs</button>
        </div>
      `;

      card.querySelector('.view-rec-btn').addEventListener('click', () => {
        // Switch to Search Tab
        const searchTab = document.querySelector('[data-tab="search-dashboard"]');
        searchTab.click();
        
        // Select this laptop
        selectLaptop(item.laptop);
      });

      recommendationsList.appendChild(card);
    });

    // Show recommendations and hide empty panel
    recommendationsEmpty.style.display = 'none';
    recommendationsContainer.style.display = 'block';
  });

});
