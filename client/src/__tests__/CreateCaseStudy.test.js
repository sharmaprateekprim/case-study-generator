import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import CreateCaseStudy from '../components/CreateCaseStudy';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
  useLocation: () => ({ search: '' })
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CreateCaseStudy Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({
      data: { success: true, labels: {} }
    });
  });

  test('renders create case study form', async () => {
    renderWithRouter(<CreateCaseStudy />);
    
    await waitFor(() => {
      expect(screen.getByText('Create Case Study')).toBeInTheDocument();
    });
    
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Point of Contact/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Executive Summary/i)).toBeInTheDocument();
  });

  test('handles form input changes', async () => {
    renderWithRouter(<CreateCaseStudy />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Case Study' } });
    
    expect(titleInput.value).toBe('Test Case Study');
  });

  test('shows incorporate feedback mode when URL param is present', async () => {
    // Mock useLocation to return incorporate feedback param
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useLocation: () => ({ search: '?incorporateFeedback=test-case-study' }),
      useParams: () => ({}),
      useNavigate: () => mockNavigate
    }));

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        caseStudy: {
          questionnaire: {
            basicInfo: { title: 'Existing Case Study' },
            content: { executiveSummary: 'Existing summary' }
          },
          labels: [],
          customMetrics: [],
          implementationWorkstreams: []
        }
      }
    });

    renderWithRouter(<CreateCaseStudy />);
    
    await waitFor(() => {
      expect(screen.getByText('Incorporate Feedback - New Version')).toBeInTheDocument();
    });
  });

  test('validates required fields before submission', async () => {
    renderWithRouter(<CreateCaseStudy />);
    
    await waitFor(() => {
      expect(screen.getByText('Submit for Review')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Submit for Review');
    fireEvent.click(submitButton);

    // Should show validation errors for empty required fields
    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
    });
  });

  test('handles successful form submission', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, processingTime: 5000 }
    });

    renderWithRouter(<CreateCaseStudy />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    });

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Title/i), { 
      target: { value: 'Test Case Study' } 
    });
    fireEvent.change(screen.getByLabelText(/Point of Contact/i), { 
      target: { value: 'test@example.com' } 
    });
    fireEvent.change(screen.getByLabelText(/Executive Summary/i), { 
      target: { value: 'Test summary' } 
    });

    const submitButton = screen.getByText('Submit for Review');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/case-studies/create',
        expect.any(FormData),
        expect.any(Object)
      );
    });
  });

  test('handles API errors gracefully', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(<CreateCaseStudy />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    });

    // Fill and submit form
    fireEvent.change(screen.getByLabelText(/Title/i), { 
      target: { value: 'Test Case Study' } 
    });
    
    const submitButton = screen.getByText('Submit for Review');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to submit case study/i)).toBeInTheDocument();
    });
  });
});
