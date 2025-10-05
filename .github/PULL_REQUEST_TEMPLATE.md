## 📝 Description

### Summary
Brief description of the changes and the motivation behind them.

### Related Issues
- Fixes #[issue number]
- Closes #[issue number]
- Related to #[issue number]

## 🔄 Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🛠️ Refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security enhancement
- [ ] 🧪 Tests (adding or fixing tests)

## 🎨 Components Changed

### Frontend
- [ ] React components
- [ ] TypeScript types
- [ ] Styling/CSS
- [ ] Authentication flow
- [ ] API integration

### Backend
- [ ] CADS (Authentication Service)
- [ ] M-SES (Security Service)
- [ ] ADCF (Data Capsule Service)
- [ ] SHEL (Hardening Service)
- [ ] ILECG (Lifecycle Service)
- [ ] QVDM (Validation Service)
- [ ] TRDN (Traceability Service)
- [ ] Shared libraries
- [ ] Database schema
- [ ] API endpoints

### Infrastructure
- [ ] Docker configuration
- [ ] Kubernetes manifests
- [ ] CI/CD pipelines
- [ ] Monitoring setup
- [ ] Documentation

## 🧪 Testing

### Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] End-to-end tests added/updated
- [ ] Security tests added/updated
- [ ] Performance tests added/updated

### Manual Testing
- [ ] Frontend functionality tested
- [ ] API endpoints tested
- [ ] Database operations tested
- [ ] Authentication flow tested
- [ ] Error handling tested
- [ ] Cross-browser testing (if applicable)

### Test Results
```bash
# Backend test results
go test ./... -v
# Add test output here

# Frontend test results
npm test
# Add test output here
```

## 🔒 Security Review

- [ ] No security implications
- [ ] Security review required
- [ ] Changes to authentication/authorization
- [ ] Cryptographic changes
- [ ] Input validation changes
- [ ] Access control changes

### Security Checklist (if applicable)
- [ ] Input validation implemented
- [ ] Authentication checks in place
- [ ] Authorization checks in place
- [ ] Sensitive data properly handled
- [ ] Error messages don't leak information
- [ ] Rate limiting considered
- [ ] Audit logging added

## 📈 Performance Impact

- [ ] No performance impact
- [ ] Minor performance improvement
- [ ] Significant performance improvement
- [ ] Potential performance degradation (explain below)

### Performance Notes
<!-- Describe any performance implications -->

## 🔍 Breaking Changes

- [ ] No breaking changes
- [ ] Breaking changes (describe below)

### Breaking Change Details
<!-- If breaking changes, describe:
1. What breaks
2. Migration path
3. Deprecation timeline
-->

## 📄 Documentation

- [ ] Code is self-documenting
- [ ] Inline comments added where necessary
- [ ] API documentation updated
- [ ] User documentation updated
- [ ] README updated
- [ ] CHANGELOG updated

## 📋 Deployment Notes

- [ ] No special deployment requirements
- [ ] Database migrations required
- [ ] Environment variable changes
- [ ] Configuration changes
- [ ] Infrastructure changes

### Deployment Checklist
<!-- If special deployment requirements, list them -->
- [ ] 
- [ ] 
- [ ] 

## 📷 Screenshots/Videos

<!-- Add screenshots or videos showing the changes in action -->

### Before
<!-- Screenshot/description of current behavior -->

### After
<!-- Screenshot/description of new behavior -->

## ✅ Checklist

### Code Quality
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is properly formatted (`go fmt`, `npm run format`)
- [ ] No linting errors (`golangci-lint`, `npm run lint`)
- [ ] No compiler warnings

### Testing
- [ ] All tests pass locally
- [ ] Test coverage maintained or improved
- [ ] Integration tests pass
- [ ] Manual testing completed

### Documentation
- [ ] Documentation updated
- [ ] API changes documented
- [ ] Breaking changes documented
- [ ] Migration guide provided (if needed)

### Security
- [ ] Security implications considered
- [ ] No sensitive data in commits
- [ ] Secrets properly managed
- [ ] Security review completed (if required)

### Compliance
- [ ] Changes comply with coding standards
- [ ] Changes comply with security requirements
- [ ] Changes comply with accessibility requirements
- [ ] Changes comply with performance requirements

## 🔗 Additional Notes

### Implementation Details
<!-- Describe any implementation details, design decisions, or trade-offs -->

### Future Improvements
<!-- List any follow-up work or improvements that could be made -->

### Dependencies
<!-- List any dependencies on other PRs, issues, or external factors -->

## 📦 Reviewer Guidelines

### Focus Areas
Please pay special attention to:
- [ ] Security implications
- [ ] Performance impact
- [ ] API design
- [ ] Error handling
- [ ] Test coverage
- [ ] Documentation clarity

### Testing Instructions
1. Checkout this branch
2. Run `./start-application.sh`
3. Test the following scenarios:
   - 
   - 
   - 

---

**Note**: This PR follows the [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).
