# BOM Management Framework - Installer Size Optimization Sprint Plan

## Sprint Overview
**Goal**: Reduce installer size from 1GB to 200-400MB (60-70% reduction) through safe, incremental optimizations.

**Total Duration**: 1-2 weeks  
**Risk Level**: Low (with proper testing)  
**Rollback Strategy**: Simple package.json revert

---

## Sprint 1: Critical ASAR Compression (HIGH PRIORITY)
**Duration**: 1-2 days  
**Impact**: 50-60% size reduction (1GB → 400-500MB)  
**Risk**: LOW - Code already supports ASAR

### Tasks
1. **Configuration Update** (30 minutes)
   - Change `"asar": false` → `"asar": true` in package.json
   - Add database unpacking to `asarUnpack` array
   - Add safe file exclusions

2. **Build & Initial Testing** (2-3 hours)
   - Run `npm run electron-pack-win`
   - Verify installer size reduction
   - Test basic app launch

3. **Comprehensive Functionality Testing** (4-6 hours)
   - Database CRUD operations
   - File imports/exports
   - Real-time features (Socket.IO)
   - Image processing (Sharp)

### Acceptance Criteria
- [ ] Installer size reduced by ≥50%
- [ ] App launches without errors
- [ ] Database operations work correctly
- [ ] All core features functional
- [ ] No console errors on startup

### Configuration Changes
```json
// package.json build section updates
{
  "asar": true,
  "asarUnpack": [
    "**/@prisma/client/**",
    "**/.prisma/**", 
    "**/node_modules/sharp/**",
    "db/**/*",
    "prisma/schema.prisma"
  ],
  "files": [
    "!**/*.map",
    "!**/node_modules/.cache/**",
    "!**/*.d.ts",
    // ... existing entries
  ]
}
```

---

## Sprint 2: Enhanced File Filtering
**Duration**: 1 day  
**Impact**: Additional 10-15% size reduction  
**Risk**: LOW - Only excludes dev artifacts

### Tasks
1. **File Exclusion Analysis** (1 hour)
   - Review current file patterns
   - Identify safe exclusions
   - Document each exclusion rationale

2. **Configuration Refinement** (30 minutes)
   - Add optimized file filters
   - Test exclusion patterns

3. **Validation Testing** (2-3 hours)
   - Verify no critical files excluded
   - Test all file operations
   - Check asset loading

### Safe Exclusions to Add
```json
"files": [
  "!**/*.map",                    // Source maps (dev only)
  "!**/node_modules/.cache/**",   // Build caches
  "!**/*.d.ts",                   // TypeScript definitions
  "!**/test*/**",                 // Test files
  "!**/{CHANGELOG.md,README.md}", // Documentation
  "!**/.{git,svn,hg}/**"          // Version control
]
```

### Acceptance Criteria
- [ ] Additional 10-15% size reduction achieved
- [ ] No missing assets or functionality
- [ ] All imports/exports work correctly
- [ ] Documentation and help files accessible

---

## Sprint 3: Bundle Analysis & Dependency Review
**Duration**: 2-3 days  
**Impact**: Potential 5-10% additional reduction  
**Risk**: MEDIUM - Requires careful evaluation

### Tasks
1. **Bundle Analysis** (4-6 hours)
   - Install webpack-bundle-analyzer
   - Generate bundle reports
   - Identify largest dependencies

2. **Dependency Audit** (2-3 hours)
   - Review heavy dependencies list
   - Evaluate usage vs. size trade-offs
   - Research lighter alternatives

3. **Impact Assessment** (2-3 hours)
   - Document each dependency's usage
   - Calculate potential savings
   - Assess replacement complexity

### Analysis Commands
```bash
# Install analysis tools
npm install -g webpack-bundle-analyzer

# Generate bundle report
npx webpack-bundle-analyzer .next/static/**/*.js

# Check individual package sizes
npm ls --depth=0
```

### Dependencies to Review
| Package | Size | Usage | Alternative |
|---------|------|--------|-------------|
| sharp | ~20MB | Image processing | Evaluate necessity |
| recharts | ~5MB | Charts | chart.js (smaller) |
| framer-motion | ~2MB | Animations | CSS animations |
| xlsx | ~2MB | Excel import/export | Evaluate usage |

### Acceptance Criteria
- [ ] Complete bundle analysis report
- [ ] Documented dependency usage patterns
- [ ] Identified potential 5-10% savings
- [ ] Risk assessment for each change

---

## Sprint 4: Advanced Optimization & Documentation
**Duration**: 1 week  
**Impact**: Long-term size management  
**Risk**: LOW - Optional optimizations

### Tasks
1. **Selective Optimization Implementation** (2-3 days)
   - Implement safe dependency replacements
   - Test each change thoroughly
   - Measure size impact

2. **Performance Monitoring Setup** (1-2 days)
   - Create size tracking scripts
   - Set up monitoring dashboard
   - Document baseline metrics

3. **Documentation & Maintenance** (2-3 days)
   - Create optimization guide
   - Document rollback procedures
   - Set up size monitoring process

### Monitoring Scripts
```bash
# Size tracking script
#!/bin/bash
echo "Installer Size Report - $(date)" >> size-log.txt
ls -la dist/*.exe | awk '{print $9 ": " $5}' >> size-log.txt

# Monthly size audit
npm run analyze-bundle
```

### Documentation Deliverables
- [ ] Optimization guide for future developers
- [ ] Size monitoring procedures
- [ ] Dependency audit checklist
- [ ] Rollback instructions
- [ ] Performance baseline report

---

## Sprint Integration & Testing Strategy

### Cross-Sprint Testing Checklist
**After each sprint, verify:**
- [ ] All existing functionality works
- [ ] Database operations (CRUD)
- [ ] File import/export (CSV/XML)
- [ ] Real-time updates (Socket.IO)
- [ ] Image processing (Sharp)
- [ ] Settings persistence
- [ ] Location-based BOM operations

### Integration Testing Schedule
- **Sprint 1**: Full regression testing (6-8 hours)
- **Sprint 2**: File operation testing (2-3 hours)
- **Sprint 3**: Performance testing (4-6 hours)
- **Sprint 4**: Long-term stability testing (ongoing)

---

## Risk Mitigation & Rollback

### Sprint-Specific Rollback Plans

**Sprint 1 Rollback** (if issues occur):
```bash
# Revert ASAR changes
git checkout HEAD~1 -- package.json
npm run electron-pack-win
```

**Sprint 2+ Rollback**:
- Each sprint creates package.json backup
- Revert specific changes via git
- Rebuild with previous configuration

### Emergency Procedures
1. **Critical Issue**: Revert to Sprint 0 configuration
2. **Performance Issue**: Disable recent optimizations
3. **Functionality Loss**: Restore unpacked files

---

## Success Metrics & Timeline

### Sprint 1 Success (Day 1-2)
- **Target**: 50-60% size reduction
- **Installer**: 1GB → 400-500MB
- **Functionality**: 100% preserved
- **Testing**: All core features verified

### Sprint 2 Success (Day 3)
- **Target**: Additional 10-15% reduction
- **Installer**: 400-500MB → 350-450MB
- **Validation**: No missing assets

### Sprint 3 Success (Week 1)
- **Target**: Complete analysis report
- **Deliverable**: Optimization roadmap
- **Risk Assessment**: Documented for each change

### Sprint 4 Success (Week 2)
- **Target**: Long-term optimization framework
- **Documentation**: Complete guides
- **Monitoring**: Automated size tracking

---

## Quick Start Commands

### Sprint 1 Implementation
```bash
# Backup current config
cp package.json package.json.backup

# Make changes (see Sprint 1 config above)
# Then build and test
npm run electron-pack-win
```

### Size Verification
```bash
# Check current installer size
ls -la dist/*.exe

# Compare with baseline
# Expected: 60-70% reduction after all sprints
```

This sprint plan prioritizes safety and incremental progress, with each sprint building on the previous one's success while maintaining full functionality.