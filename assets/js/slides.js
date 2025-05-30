// Complete slideshow functionality with custom scaling

startSlideshow = async function () {
  const doc = document.querySelector('.main-content');
  const slides = document.getElementById('slideshow-view');

  try {
    // Switch to slideshow mode
    doc.style.display = 'none';
    slides.style.display = 'block';
    
    // Collapse sidebar and store previous state
    collapseSidebarForSlideshow();
    
    // Clear any existing slides and destroy Reveal instance first
    const slideContainer = document.getElementById('slides-container');
    slideContainer.innerHTML = '';
    
    // Destroy existing Reveal instance if it exists
    if (typeof Reveal !== 'undefined' && Reveal.isReady && Reveal.isReady()) {
      // Exit overview mode if currently active before destroying
      if (Reveal.isOverview()) {
        Reveal.toggleOverview(false);
      }
      await Reveal.destroy();
    }
    
    // Build slides and wait for DOM to be ready, then scale
    await buildSlidesAsync();
    await scaleSlidesAsync();

    // Initialize Reveal.js
    await Reveal.initialize({
      controls: true,
      progress: true,
      hash: false,
      transition: 'slide',
      embedded: true,
      
      // Use white theme for better Mermaid diagram visibility
      theme: 'white',
      
      // Simple fixed dimensions - we'll handle scaling ourselves
      width: '100%',
      height: '100%',
      
      // Disable Reveal's scaling since we're doing it ourselves
      minScale: 1,
      maxScale: 1,
      margin: 0.1,
      center: true,
      
      keyboard: {
        27: function() { // ESC key
          if (Reveal.isOverview()) {
            Reveal.toggleOverview(false);
          } else {
            exitSlideshow();
          }
        },
        13: function() { // Enter key
          if (Reveal.isOverview()) {
            Reveal.toggleOverview(false);
          } else {
            Reveal.toggleOverview(true);
          }
        },
        37: 'left', 39: 'right', 38: 'up', 40: 'down',
        32: 'next', 33: 'prev', 34: 'next', 35: 'last', 36: 'first'
      }
    });
    
    // Force exit overview mode after initialization (in case it persists)
    if (Reveal.isOverview()) {
      Reveal.toggleOverview(false);
    }
    
    // Force go to first slide to ensure clean start
    Reveal.slide(0, 0);
    
    // Add event listeners for slide changes and overview mode
    Reveal.on('overviewhidden', function(event) {
      // Use requestAnimationFrame for smooth scaling
      requestAnimationFrame(() => scaleSlides());
    });
    
    Reveal.on('overviewshown', function(event) {
      // Scale slides when overview is shown
      requestAnimationFrame(() => scaleSlides());
    });
    
  } catch (error) {
    console.error('Failed to initialize slideshow:', error);
    // Revert to document view on error
    doc.style.display = 'block';
    slides.style.display = 'none';
    restoreSidebarFromSlideshow();
    throw error; // Re-throw to let caller handle if needed
  }
}

// Async wrapper for buildSlides that waits for DOM rendering
async function buildSlidesAsync() {
  return new Promise((resolve, reject) => {
    try {
      buildSlides();
      // Wait for DOM changes to be fully rendered
      requestAnimationFrame(() => {
        // Double RAF ensures all layout changes are complete
        requestAnimationFrame(() => {
          resolve();
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Async wrapper for scaleSlides that waits for scaling to complete
async function scaleSlidesAsync() {
  return new Promise((resolve, reject) => {
    try {
      scaleSlides();
      // Wait for scaling transforms to be applied
      requestAnimationFrame(() => {
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function exitSlideshow() {
  const doc = document.querySelector('.main-content');
  const slides = document.getElementById('slideshow-view');
  
  // Destroy Reveal instance if it exists and wait for completion
  if (typeof Reveal !== 'undefined' && Reveal.isReady && Reveal.isReady()) {
    try {
      // Exit overview mode if currently active before destroying
      if (Reveal.isOverview()) {
        Reveal.toggleOverview(false);
      }
      
      // Clear any URL hash that Reveal might have set
      if (window.location.hash) {
        history.replaceState('', document.title, window.location.pathname + window.location.search);
      }
      
      await Reveal.destroy();
    } catch (error) {
      console.error('Error destroying Reveal:', error);
    }
  }
  
  // Clear all slide content to prevent accumulation
  const slideContainer = document.getElementById('slides-container');
  if (slideContainer) {
    slideContainer.innerHTML = '';
  }
  
  // Force all slides to be hidden (clean up any remaining display: block)
  const allSlides = document.querySelectorAll('#slides-container section');
  allSlides.forEach(slide => {
    slide.style.display = '';
    slide.style.transform = '';
    slide.style.width = '';
    slide.style.height = '';
  });
  
  // Toggle visibility
  doc.style.display = 'block';
  slides.style.display = 'none';
  
  
  // Restore sidebar state
  restoreSidebarFromSlideshow();
}

// Store sidebar state before slideshow and collapse it
function collapseSidebarForSlideshow() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  
  if (sidebar && sidebarToggle) {
    // Store current collapsed state
    const wasCollapsed = sidebar.classList.contains('collapsed');
    
    // Store in a temporary property for restoration
    window.sidebarStateBeforeSlideshow = wasCollapsed;
    
    // Collapse sidebar if not already collapsed
    if (!wasCollapsed) {
      sidebar.classList.add('collapsed');
      sidebarToggle.classList.add('collapsed');
      
      const arrow = sidebarToggle.querySelector('span');
      if (arrow) arrow.innerHTML = '›';
    }
  }
}

// Restore sidebar state after slideshow
function restoreSidebarFromSlideshow() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  
  if (sidebar && sidebarToggle && typeof window.sidebarStateBeforeSlideshow !== 'undefined') {
    // Restore to previous state
    if (!window.sidebarStateBeforeSlideshow) {
      // Was expanded before slideshow, so expand it again
      sidebar.classList.remove('collapsed');
      sidebarToggle.classList.remove('collapsed');
      
      const arrow = sidebarToggle.querySelector('span');
      if (arrow) arrow.innerHTML = '‹';
    }
    
    // Clean up temporary storage
    delete window.sidebarStateBeforeSlideshow;
  }
}

function buildSlides() {
  // Get the main content and create a clean copy
  const contentElement = document.querySelector('.content');
  const contentCopy = contentElement.cloneNode(true);
  
  // Remove all no-print elements
  contentCopy.querySelectorAll('.no-print').forEach(el => el.remove());
  
  // Remove page header (H1) elements
  // contentCopy.querySelectorAll('h1').forEach(el => el.remove());
  
  // Remove any remaining export buttons or navigation elements
  contentCopy.querySelectorAll('.export-options, .export-buttons, .export-btn').forEach(el => el.remove());
  
  // Get the cleaned content
  const cleanContent = contentCopy.innerHTML;
  
  // Split content by H2 headers first
  const h2Regex = /<h2[^>]*>.*?<\/h2>/gi;
  const h2Headers = cleanContent.match(h2Regex) || [];
  const h2Sections = cleanContent.split(h2Regex);
  
  // Clear the slide container
  const slideContainer = document.getElementById('slides-container');
  slideContainer.innerHTML = '';
  
  // Process each H2 section
  for (let i = 0; i < h2Headers.length; i++) {
    const h2Content = h2Sections[i + 1] || '';
    const fullH2Section = h2Headers[i] + h2Content;
    
    // Check if this section has H3 headers
    const h3Regex = /<h3[^>]*>.*?<\/h3>/gi;
    const h3Headers = h2Content.match(h3Regex) || [];
    
    if (h3Headers.length > 0) {
      // Create vertical slides for H3 subsections
      const verticalSection = document.createElement('section');
      
      // Split H2 content by H3 headers
      const h3Sections = h2Content.split(h3Regex);
      
      // First slide: H2 + content before first H3
      const firstSlide = document.createElement('section');
      const firstSlideContent = h2Headers[i] + (h3Sections[0] || '');
      firstSlide.innerHTML = firstSlideContent.trim();
      verticalSection.appendChild(firstSlide);
      
      // Subsequent slides: Each H3 + its content
      for (let j = 0; j < h3Headers.length; j++) {
        const h3Slide = document.createElement('section');
        const h3Content = h3Headers[j] + (h3Sections[j + 1] || '');
        h3Slide.innerHTML = h3Content.trim();
        verticalSection.appendChild(h3Slide);
      }
      
      slideContainer.appendChild(verticalSection);
    } else {
      // No H3 headers, create a single slide
      const slide = document.createElement('section');
      slide.innerHTML = fullH2Section.trim();
      slideContainer.appendChild(slide);
    }
  }
  
  // If there's content before the first H2, create an intro slide
  if (h2Sections[0] && h2Sections[0].trim()) {
    const introSlide = document.createElement('section');
    introSlide.innerHTML = h2Sections[0].trim();
    slideContainer.insertBefore(introSlide, slideContainer.firstChild);
  }
  
  // Note: We'll call scaleSlides after Reveal is initialized
}

function scaleSlides() {
  
  // Handle both direct slides and nested vertical slides
  const allSlides = document.querySelectorAll('#slides-container section section, #slides-container > section:not(:has(section))');
  const slideshow = document.getElementById('slideshow-view');
  
  // Get available space (accounting for controls and margins)
  const availableWidth = slideshow.clientWidth;
  const availableHeight = slideshow.clientHeight-50;
  
  allSlides.forEach(slide => {
    // Store any existing Reveal.js transforms
    const currentTransform = slide.style.transform || '';
    const revealTransforms = extractRevealTransforms(currentTransform);
    
    // Temporarily reset transform to measure natural content size
    slide.style.transform = 'none';
    slide.style.width = 'auto';
    slide.style.height = 'auto';
    slide.style.transformOrigin = 'top left';
    
    // Force a reflow
    slide.offsetHeight;
        
    // Measure the natural content size
    const contentWidth = slide.scrollWidth;
    const contentHeight = slide.scrollHeight;
    
    // Calculate scale factors
    const scaleX = availableWidth / contentWidth;
    const scaleY = availableHeight / contentHeight;
    
    // Use the smaller scale to ensure everything fits, but cap the maximum scale
    let scale = Math.min(scaleX, scaleY);
    
    // Prevent excessive scaling up - limit maximum scale
    // This prevents single headings from becoming too large
    const maxScale = 1.0; // Don't scale beyond 100%
    scale = Math.min(scale, maxScale);
    
    // Also ensure we don't scale down too much for readability
    const minScale = 0.3; // Don't go below 30%
    scale = Math.max(scale, minScale);
    
    // Combine our scaling with Reveal's transforms
    // Apply our scale first, then Reveal's transforms on top
    const combinedTransform = `${revealTransforms} scale(${scale})`.trim();
    slide.style.transform = combinedTransform;
    
    // Adjust dimensions to fit the slide container
    if (scaleY < scaleX) {
      // Height is the limiting factor
      slide.style.width = `${availableWidth / scale}px`;
      slide.style.maxWidth = `${availableWidth / scale}px`;
    } else {
      slide.style.height = `${availableHeight / scale}px`;
      slide.style.maxHeight = `${availableHeight / scale}px`;
    }
    
    console.log(`Slide: content=${contentWidth}x${contentHeight}, available=${availableWidth}x${availableHeight}, scale=${scale} (capped), combined transform: ${combinedTransform}`);
  });
}

// Helper function to extract Reveal.js transforms while preserving our scaling
function extractRevealTransforms(transformString) {
  if (!transformString || transformString === 'none') {
    return '';
  }
  
  // Remove any existing scale() transforms that we might have added
  // Keep all other transforms (translate, rotate, etc. that Reveal.js adds)
  const transforms = transformString.match(/(\w+\([^)]+\))/g) || [];
  const nonScaleTransforms = transforms.filter(transform => !transform.startsWith('scale('));
  
  return nonScaleTransforms.join(' ');
}

function clearSlideScaling() {
  // Remove all custom scaling from slides
  const allSlides = document.querySelectorAll('#slides-container section section, #slides-container > section:not(:has(section))');
  
  allSlides.forEach(slide => {
    slide.style.transform = '';
    slide.style.width = '';
    slide.style.height = '';
  });
}