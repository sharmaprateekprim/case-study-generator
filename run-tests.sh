#!/bin/bash

echo "🧪 Case Study Generator - Comprehensive Test Suite"
echo "=================================================="

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install --silent
cd client && npm install --silent && cd ..

echo ""
echo "🔧 Running Backend Unit Tests..."
echo "--------------------------------"
npm test -- --verbose

echo ""
echo "🎨 Running Frontend Component Tests..."
echo "-------------------------------------"
cd client
npm test -- --watchAll=false --verbose
cd ..

echo ""
echo "🔗 Running Integration Tests..."
echo "------------------------------"
npm test -- --testPathPattern=integration --verbose

echo ""
echo "📊 Generating Coverage Report..."
echo "-------------------------------"
npm run test:coverage

echo ""
echo "✅ Test Summary:"
echo "- Backend API routes tested"
echo "- Frontend components tested"  
echo "- Integration workflows tested"
echo "- Error handling validated"
echo "- Versioning logic verified"
echo "- Review system tested"

echo ""
echo "🎉 All tests completed! Check coverage report for details."
