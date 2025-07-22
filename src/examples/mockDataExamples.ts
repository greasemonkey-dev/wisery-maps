/**
 * Examples of how to use the mock events data for development and testing
 */

import {
  getAllLocationsAsMapPoints,
  getLocationsByConversation,
  getLocationsByMessage,
  getClusteringTestScenarios,
  getLondonLocations,
  getInternationalLocations,
  getMockDataStats,
  getLocationsByBoundingBox,
} from '../utils/mockDataLoader';
import { initializeClustering, getClusters, shouldCluster } from '../utils/pointClustering';

/**
 * Example 1: Load all locations for initial map display
 */
export function exampleLoadAllLocations() {
  console.log('=== Example 1: Load All Locations ===');
  
  const allLocations = getAllLocationsAsMapPoints();
  console.log(`Total locations: ${allLocations.length}`);
  
  // Show first few locations
  allLocations.slice(0, 3).forEach(location => {
    console.log(`- ${location.label} at [${location.coordinates.join(', ')}]`);
    console.log(`  Context: ${location.context}`);
    console.log(`  Time: ${location.timestamp}`);
  });
  
  return allLocations;
}

/**
 * Example 2: HLD Primary Use Case - Investigation Area Workflow
 */
export function exampleInvestigationWorkflow() {
  console.log('\n=== Example 2: Investigation Workflow ===');
  
  // Step 1: User opens map from conversation with extracted locations
  const warehouseMessages = getLocationsByConversation('conv_warehouse_investigation');
  console.log(`Loaded ${warehouseMessages.length} message groups from warehouse investigation`);
  
  warehouseMessages.forEach(messageGroup => {
    console.log(`Message: ${messageGroup.summary}`);
    console.log(`Locations: ${messageGroup.locations.length} points`);
    
    messageGroup.locations.forEach(location => {
      console.log(`  - ${location.label}: ${location.context}`);
    });
  });
  
  // Step 2: User reviews location clusters and spatial patterns
  const warehouseLocations = getLocationsByMessage('msg_warehouse_calls');
  console.log(`\nWarehouse district has ${warehouseLocations.length} suspicious activities:`);
  
  // Step 3: User defines area of interest (triangle drawing)
  // In real app, user would draw triangle around warehouse area
  const warehouseBbox = getLocationsByBoundingBox(-0.13, 51.506, -0.126, 51.509);
  console.log(`Area contains ${warehouseBbox.length} events within investigation zone`);
  
  return { warehouseMessages, warehouseLocations };
}

/**
 * Example 3: Clustering Scenarios for Testing
 */
export function exampleClusteringScenarios() {
  console.log('\n=== Example 3: Clustering Test Scenarios ===');
  
  const scenarios = getClusteringTestScenarios();
  
  Object.entries(scenarios).forEach(([scenarioName, locations]) => {
    console.log(`\n${scenarioName.toUpperCase()}:`);
    console.log(`- ${locations.length} locations`);
    
    // Test clustering at different zoom levels
    const cluster = initializeClustering(locations);
    const bbox: [number, number, number, number] = [-180, -90, 180, 90];
    
    const lowZoomClusters = getClusters(cluster, bbox, 8);
    const highZoomClusters = getClusters(cluster, bbox, 15);
    
    console.log(`- Low zoom (8): ${lowZoomClusters.length} clusters`);
    console.log(`- High zoom (15): ${highZoomClusters.length} clusters`);
    console.log(`- Should cluster at zoom 14: ${shouldCluster(14)}`);
    console.log(`- Should cluster at zoom 15: ${shouldCluster(15)}`);
  });
  
  return scenarios;
}

/**
 * Example 4: Geographic Distribution Analysis
 */
export function exampleGeographicAnalysis() {
  console.log('\n=== Example 4: Geographic Analysis ===');
  
  const stats = getMockDataStats();
  console.log(`Total events: ${stats.locations}`);
  console.log(`London events: ${stats.londonLocations}`);
  console.log(`International events: ${stats.internationalLocations}`);
  console.log(`Date range: ${stats.dateRange.start} to ${stats.dateRange.end}`);
  
  // Show geographic distribution
  const londonLocs = getLondonLocations();
  const internationalLocs = getInternationalLocations();
  
  console.log('\nLondon Districts:');
  const londonDistricts = londonLocs.reduce((districts, loc) => {
    const district = loc.label.split(' ')[0] || 'Unknown';
    districts[district] = (districts[district] || 0) + 1;
    return districts;
  }, {} as Record<string, number>);
  
  Object.entries(londonDistricts).forEach(([district, count]) => {
    console.log(`- ${district}: ${count} events`);
  });
  
  console.log('\nInternational Cities:');
  internationalLocs.forEach(loc => {
    console.log(`- ${loc.label} at [${loc.coordinates.join(', ')}]`);
  });
  
  return { stats, londonLocs, internationalLocs };
}

/**
 * Example 5: Dense Area Clustering (HLD Multiple Events Message)
 */
export function exampleDenseAreaClustering() {
  console.log('\n=== Example 5: Dense Area Clustering ===');
  
  // Get dense cluster scenario (Covent Garden - 8 points within ~200m)
  const densePoints = getClusteringTestScenarios().dense_cluster;
  console.log(`Dense area has ${densePoints.length} events`);
  
  // Test clustering behavior
  const cluster = initializeClustering(densePoints);
  const londonBbox: [number, number, number, number] = [-0.13, 51.51, -0.12, 51.52];
  
  // At medium zoom, should show cluster badge
  const mediumZoomClusters = getClusters(cluster, londonBbox, 12);
  const clusterFeature = mediumZoomClusters.find(c => c.properties.cluster);
  
  if (clusterFeature) {
    console.log(`Cluster badge shows: "📍 ${clusterFeature.properties.point_count}"`);
    console.log('User sees message: "Multiple Events at This Location"');
    console.log('Options: [Zoom In] [Show List]');
  }
  
  // At high zoom, should separate individual points
  const highZoomClusters = getClusters(cluster, londonBbox, 16);
  const individualPoints = highZoomClusters.filter(c => !c.properties.cluster);
  console.log(`At street level: ${individualPoints.length} individual points visible`);
  
  return { densePoints, clusterFeature, individualPoints };
}

/**
 * Example 6: Multi-Message Investigation (Gang Territory)
 */
export function exampleMultiMessageInvestigation() {
  console.log('\n=== Example 6: Multi-Message Investigation ===');
  
  const gangMessages = getLocationsByConversation('conv_gang_territory');
  console.log(`Gang territory investigation: ${gangMessages.length} message groups`);
  
  gangMessages.forEach((messageGroup, index) => {
    console.log(`\nMessage ${index + 1}: ${messageGroup.summary}`);
    console.log(`Time: ${messageGroup.timestamp.toLocaleString()}`);
    console.log(`Locations:`);
    
    messageGroup.locations.forEach(location => {
      console.log(`  - ${location.label}`);
      console.log(`    Context: ${location.context}`);
      console.log(`    Coordinates: [${location.coordinates.join(', ')}]`);
      console.log(`    Time: ${location.timestamp ? new Date(location.timestamp).toLocaleTimeString() : 'No timestamp'}`);
    });
  });
  
  // Show how locations are grouped for hierarchical display
  const allGangLocations = getLocationsByMessage('msg_south_london');
  console.log(`\nHierarchical view:`);
  console.log(`📍 Gang Territory Analysis (${allGangLocations.length} points)`);
  console.log(`├─ 🕐 Coordinated activity in South London`);
  allGangLocations.forEach((location, index) => {
    const isLast = index === allGangLocations.length - 1;
    const prefix = isLast ? '└─' : '├─';
    console.log(`│  ${prefix} 📍 ${location.label}`);
  });
  
  return { gangMessages, allGangLocations };
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('🗺️  WISERY MAPS - MOCK DATA EXAMPLES\n');
  
  exampleLoadAllLocations();
  exampleInvestigationWorkflow(); 
  exampleClusteringScenarios();
  exampleGeographicAnalysis();
  exampleDenseAreaClustering();
  exampleMultiMessageInvestigation();
  
  console.log('\n✅ All examples completed!');
  console.log('This mock data supports all HLD requirements:');
  console.log('- Triangle-based area selection');
  console.log('- Location clustering with zoom-based behavior');
  console.log('- Hierarchical message/location organization');
  console.log('- Dense area handling (📍 badges)');
  console.log('- Investigation workflow scenarios');
  console.log('- Performance testing with hundreds of points');
}