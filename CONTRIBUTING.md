# Contributing to UARS-7

🎉 Thank you for your interest in contributing to the Universal Adaptive Resilience System - Generation 7!

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Setup](#-development-setup)
- [Contribution Process](#-contribution-process)
- [Coding Standards](#-coding-standards)
- [Testing Guidelines](#-testing-guidelines)
- [Security Guidelines](#-security-guidelines)
- [Documentation](#-documentation)
- [Community](#-community)

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## 🚀 Getting Started

### Prerequisites

- **Go** 1.21 or higher
- **Node.js** 18 or higher
- **Docker** and Docker Compose
- **Git** 2.30 or higher
- **Make** for build automation

### First Time Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/uars7.git
   cd uars7
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/Portalvii/uars7.git
   ```

3. **Set up development environment**
   ```bash
   # Start infrastructure services
   cd Backend/uars-platform
   make dev-up
   
   # Install frontend dependencies
   cd ../../uars7-frontend
   npm install
   ```

4. **Verify setup**
   ```bash
   # Run the complete startup script
   ./start-application.sh
   ```

## 🛠️ Development Setup

### Backend Development

```bash
cd Backend/uars-platform

# Install Go dependencies
go mod download

# Build all services
make build-all

# Run tests
make test-all

# Start backend services
./start-backend.sh start
```

### Frontend Development

```bash
cd uars7-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Run linting
npm run lint

# Run type checking
npm run type-check
```

### Environment Configuration

Create a `.env.local` file in the frontend directory:

```env
VITE_API_URL=http://localhost:8082
VITE_ENVIRONMENT=development
VITE_LOG_LEVEL=debug
```

## 🔄 Contribution Process

### 1. Planning

- **Check existing issues** for similar work
- **Create an issue** for new features or bugs
- **Discuss approach** with maintainers
- **Get approval** for significant changes

### 2. Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code, test, commit ...

# Keep branch updated
git fetch upstream
git rebase upstream/main
```

### 3. Testing

```bash
# Backend tests
cd Backend/uars-platform
make test-all

# Frontend tests
cd uars7-frontend
npm run test
npm run test:e2e

# Integration tests
./scripts/integration-tests.sh
```

### 4. Submission

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Fill out the PR template completely
```

### 5. Review Process

- **Automated checks** must pass
- **Code review** by maintainers
- **Security review** for sensitive changes
- **Testing** in staging environment
- **Documentation** updates if needed

## 📝 Coding Standards

### Go Standards

#### Code Format
```bash
# Format code
go fmt ./...

# Run linter
golangci-lint run

# Check for race conditions
go test -race ./...
```

#### Best Practices
- Follow [Effective Go](https://golang.org/doc/effective_go.html)
- Use meaningful variable and function names
- Add comprehensive error handling
- Include unit tests for all public functions
- Document exported functions and types

#### Example Code Structure
```go
package service

import (
    "context"
    "fmt"
    
    "github.com/portalvii/uars7/shared/types"
)

// UserService handles user-related operations
type UserService struct {
    repo UserRepository
    logger Logger
}

// CreateUser creates a new user with validation
func (s *UserService) CreateUser(ctx context.Context, user *types.User) error {
    if err := s.validateUser(user); err != nil {
        return fmt.Errorf("user validation failed: %w", err)
    }
    
    return s.repo.Create(ctx, user)
}
```

### TypeScript/React Standards

#### Code Format
```bash
# Format code
npm run format

# Run linter
npm run lint

# Type checking
npm run type-check
```

#### Best Practices
- Use TypeScript for all new code
- Follow React hooks patterns
- Implement proper error boundaries
- Use meaningful component and prop names
- Add JSDoc comments for complex logic

#### Component Structure
```typescript
import React, { useState, useEffect } from 'react';
import { ApiError } from '../types/errors';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

/**
 * UserProfile component displays and manages user information
 */
export const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  onUpdate 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  
  useEffect(() => {
    loadUser();
  }, [userId]);
  
  const loadUser = async () => {
    try {
      setLoading(true);
      const userData = await userService.getUser(userId);
      setUser(userData);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;
  
  return (
    <div className="user-profile">
      {/* Component JSX */}
    </div>
  );
};
```

## 🧪 Testing Guidelines

### Backend Testing

#### Unit Tests
```go
func TestUserService_CreateUser(t *testing.T) {
    tests := []struct {
        name    string
        user    *types.User
        wantErr bool
    }{
        {
            name: "valid user",
            user: &types.User{
                Email:    "test@example.com",
                Username: "testuser",
            },
            wantErr: false,
        },
        {
            name: "invalid email",
            user: &types.User{
                Email:    "invalid-email",
                Username: "testuser",
            },
            wantErr: true,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            service := NewUserService(mockRepo, mockLogger)
            err := service.CreateUser(context.Background(), tt.user)
            
            if tt.wantErr {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

#### Integration Tests
```go
func TestUserAPI_Integration(t *testing.T) {
    // Setup test database
    db := setupTestDB(t)
    defer cleanupTestDB(t, db)
    
    // Create test server
    server := setupTestServer(t, db)
    defer server.Close()
    
    // Test API endpoints
    client := &http.Client{}
    // ... test implementation
}
```

### Frontend Testing

#### Component Tests
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfile } from './UserProfile';
import { userService } from '../services/userService';

jest.mock('../services/userService');

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('displays user information when loaded', async () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    (userService.getUser as jest.Mock).mockResolvedValue(mockUser);
    
    render(<UserProfile userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });
  
  it('handles loading state', () => {
    (userService.getUser as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    
    render(<UserProfile userId="1" />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### Test Coverage Requirements

- **Backend**: Minimum 80% code coverage
- **Frontend**: Minimum 75% code coverage
- **Critical paths**: 95% coverage required
- **Security functions**: 100% coverage required

## 🔒 Security Guidelines

### Security Review Requirements

All contributions must undergo security review if they:

- Modify authentication or authorization logic
- Handle sensitive data or credentials
- Implement cryptographic functions
- Change API endpoints or data validation
- Modify security-related configurations

### Security Best Practices

#### Input Validation
```go
// Good: Validate all inputs
func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }
    
    if err := h.validator.Validate(req); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    // Process validated request
}
```

#### Error Handling
```go
// Good: Don't leak sensitive information
func (s *AuthService) Login(username, password string) error {
    user, err := s.repo.GetUser(username)
    if err != nil {
        // Log detailed error internally
        s.logger.Error("Database error during login", "error", err)
        // Return generic error to client
        return errors.New("authentication failed")
    }
    
    if !s.verifyPassword(user.PasswordHash, password) {
        // Log security event
        s.logger.Warn("Failed login attempt", "username", username)
        return errors.New("authentication failed")
    }
    
    return nil
}
```

### Secret Management

- **Never commit secrets** to version control
- **Use environment variables** for configuration
- **Rotate secrets regularly**
- **Use proper secret scanning** tools

## 📚 Documentation

### Code Documentation

#### Go Documentation
```go
// Package auth provides authentication and authorization services
// for the UARS-7 platform. It implements FIDO2/WebAuthn protocols
// and military-grade security standards.
package auth

// AuthService handles user authentication using WebAuthn protocols.
// It provides secure, passwordless authentication with support for
// hardware security keys and biometric authentication.
type AuthService struct {
    webauthn *webauthn.WebAuthn
    sessions SessionStore
    logger   Logger
}

// BeginLogin initiates the WebAuthn login ceremony for a user.
// It returns assertion options that should be sent to the client
// for credential verification.
//
// Parameters:
//   - ctx: Request context for cancellation and timeouts
//   - username: The username of the authenticating user
//
// Returns:
//   - *protocol.CredentialAssertion: Assertion options for the client
//   - error: Any error that occurred during the process
func (s *AuthService) BeginLogin(ctx context.Context, username string) (*protocol.CredentialAssertion, error) {
    // Implementation
}
```

#### TypeScript Documentation
```typescript
/**
 * Authentication service providing FIDO2/WebAuthn integration
 * for the UARS-7 frontend application.
 */
export class AuthService {
  /**
   * Initiates the WebAuthn login process
   * 
   * @param username - User's username for authentication
   * @returns Promise resolving to login challenge data
   * @throws {AuthError} When authentication initiation fails
   * 
   * @example
   * ```typescript
   * const challenge = await authService.beginLogin('user@example.com');
   * const credential = await navigator.credentials.get(challenge);
   * ```
   */
  async beginLogin(username: string): Promise<LoginChallenge> {
    // Implementation
  }
}
```

### API Documentation

Use OpenAPI/Swagger for API documentation:

```yaml
/auth/login/begin:
  post:
    summary: Begin WebAuthn login ceremony
    description: |
      Initiates the WebAuthn authentication process by generating
      assertion options for the specified user.
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              username:
                type: string
                description: User's username
                example: "user@example.com"
    responses:
      '200':
        description: Login challenge generated successfully
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginChallenge'
      '400':
        description: Invalid request
      '404':
        description: User not found
```

## 🎯 Pull Request Guidelines

### PR Title Format
```
type(scope): brief description

Examples:
feat(auth): add FIDO2 biometric authentication
fix(api): resolve CORS issue in login endpoint
docs(readme): update installation instructions
refactor(frontend): improve error handling in UserProfile
test(backend): add integration tests for CADS service
```

### PR Description Template

```markdown
## Description
Brief description of the changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Security review completed (if applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No new security vulnerabilities introduced

## Screenshots/Videos
(If applicable)

## Additional Notes
Any additional information, concerns, or context.
```

## 🏆 Recognition

### Contribution Levels

- **🥉 Contributor**: First merged PR
- **🥈 Regular Contributor**: 5+ merged PRs
- **🥇 Core Contributor**: 20+ merged PRs + significant features
- **💎 Maintainer**: Trusted with review and merge privileges

### Hall of Fame

Outstanding contributors will be featured in our:
- Project README
- Release notes
- Community newsletter
- Annual contributor awards

## 🤔 Getting Help

### Discussion Channels

- **GitHub Discussions**: General questions and ideas
- **GitHub Issues**: Bug reports and feature requests
- **Discord**: Real-time chat (invite link in issues)
- **Email**: [contributors@portalvii.com](mailto:contributors@portalvii.com)

### Office Hours

Maintainers host weekly office hours:
- **When**: Fridays 2-3 PM EST
- **Where**: Discord voice channel
- **Topics**: Questions, code review, architecture discussions

## 📄 License

By contributing to UARS-7, you agree that your contributions will be licensed under the project's [Proprietary License](LICENSE).

---

**Thank you for contributing to UARS-7! Together, we're building the future of secure, resilient systems.** 🚀
