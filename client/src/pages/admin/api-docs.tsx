import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Book, 
  Search, 
  Code, 
  Play,
  Copy,
  CheckCircle,
  Send,
  Globe,
  Lock,
  Zap,
  Database
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useToast } from '@/hooks/use-toast';

interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  category: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Response[];
  authentication: 'required' | 'optional' | 'none';
  permissions?: string[];
}

interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header';
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

interface RequestBody {
  contentType: string;
  schema: any;
  example: any;
}

interface Response {
  status: number;
  description: string;
  example: any;
}

export default function APIDocsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [testRequest, setTestRequest] = useState({
    method: 'GET',
    url: '',
    headers: '{}',
    body: '{}'
  });
  const { toast } = useToast();

  // Mock API endpoints data
  const apiEndpoints: APIEndpoint[] = [
    {
      id: 'get-users',
      method: 'GET',
      path: '/api/admin/users',
      summary: 'List all users',
      description: 'Retrieve a paginated list of all users in the system with optional filtering',
      category: 'Users',
      parameters: [
        {
          name: 'page',
          in: 'query',
          type: 'integer',
          required: false,
          description: 'Page number for pagination',
          example: 1
        },
        {
          name: 'limit',
          in: 'query',
          type: 'integer',
          required: false,
          description: 'Number of items per page',
          example: 20
        },
        {
          name: 'search',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Search term for filtering users',
          example: 'john@example.com'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'Successful response',
          example: {
            users: [
              {
                id: 'user-1',
                email: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user',
                status: 'active'
              }
            ],
            total: 100,
            page: 1,
            limit: 20
          }
        },
        {
          status: 401,
          description: 'Unauthorized - Authentication required',
          example: { message: 'Unauthorized' }
        }
      ],
      authentication: 'required',
      permissions: ['user.view']
    },
    {
      id: 'create-user',
      method: 'POST',
      path: '/api/admin/users',
      summary: 'Create new user',
      description: 'Create a new user account with specified details',
      category: 'Users',
      requestBody: {
        contentType: 'application/json',
        schema: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['user', 'moderator', 'admin'] }
          },
          required: ['email', 'firstName', 'lastName']
        },
        example: {
          email: 'newuser@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'user'
        }
      },
      responses: [
        {
          status: 201,
          description: 'User created successfully',
          example: {
            id: 'user-new',
            email: 'newuser@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'user',
            status: 'active'
          }
        },
        {
          status: 400,
          description: 'Invalid input data',
          example: { message: 'Email already exists' }
        }
      ],
      authentication: 'required',
      permissions: ['user.create']
    },
    {
      id: 'ai-analyze',
      method: 'POST',
      path: '/api/admin/ai-moderation/analyze',
      summary: 'Analyze content with AI',
      description: 'Submit content for AI-powered moderation analysis',
      category: 'AI Moderation',
      requestBody: {
        contentType: 'application/json',
        schema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            context: { type: 'string', enum: ['trip', 'user', 'comment'] }
          },
          required: ['content']
        },
        example: {
          content: 'This is some content to analyze',
          context: 'trip'
        }
      },
      responses: [
        {
          status: 200,
          description: 'Analysis completed',
          example: {
            analysis: {
              toxicity: 0.1,
              sentiment: 'positive',
              riskLevel: 'low'
            },
            decision: {
              action: 'approve',
              confidence: 0.95
            }
          }
        }
      ],
      authentication: 'required',
      permissions: ['moderation.manage']
    },
    {
      id: 'get-reports',
      method: 'GET',
      path: '/api/admin/reports',
      summary: 'List reports',
      description: 'Retrieve all content moderation reports with filtering options',
      category: 'Moderation',
      parameters: [
        {
          name: 'status',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Filter by report status',
          example: 'open'
        },
        {
          name: 'priority',
          in: 'query',
          type: 'string',
          required: false,
          description: 'Filter by priority level',
          example: 'high'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'List of reports',
          example: [
            {
              id: 'report-1',
              context: 'trip',
              reason: 'inappropriate_content',
              status: 'open',
              priority: 'medium'
            }
          ]
        }
      ],
      authentication: 'required',
      permissions: ['moderation.view']
    }
  ];

  const categories = ['all', ...Array.from(new Set(apiEndpoints.map(e => e.category)))];

  const filteredEndpoints = apiEndpoints.filter(endpoint => {
    const matchesSearch = !searchTerm || 
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || endpoint.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-500';
      case 'POST': return 'bg-green-500';
      case 'PUT': return 'bg-yellow-500';
      case 'DELETE': return 'bg-red-500';
      case 'PATCH': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const testEndpoint = async () => {
    try {
      const response = await fetch(testRequest.url, {
        method: testRequest.method,
        headers: {
          'Content-Type': 'application/json',
          ...JSON.parse(testRequest.headers)
        },
        body: testRequest.method !== 'GET' ? testRequest.body : undefined
      });
      
      const result = await response.json();
      toast({
        title: "API Test Complete",
        description: `Status: ${response.status}`,
        variant: response.ok ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "API Test Failed",
        description: "Check your request parameters",
        variant: "destructive"
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Documentation</h1>
            <p className="text-muted-foreground">
              Complete reference for the HiBowan Admin API
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Version 1.0</Badge>
            <Badge variant="secondary">REST API</Badge>
          </div>
        </div>

        <Tabs defaultValue="endpoints" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="testing">API Testing</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="schemas">Schemas</TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sidebar */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Browse APIs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search endpoints..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                      data-testid="input-api-search"
                    />
                  </div>

                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="space-y-2">
                    {filteredEndpoints.map(endpoint => (
                      <div
                        key={endpoint.id}
                        className={`p-3 rounded-md border cursor-pointer hover:bg-muted ${
                          selectedEndpoint?.id === endpoint.id ? 'bg-muted border-primary' : ''
                        }`}
                        onClick={() => setSelectedEndpoint(endpoint)}
                        data-testid={`endpoint-${endpoint.id}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${getMethodColor(endpoint.method)} text-white text-xs`}>
                            {endpoint.method}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{endpoint.category}</span>
                        </div>
                        <p className="text-sm font-medium">{endpoint.summary}</p>
                        <p className="text-xs text-muted-foreground font-mono">{endpoint.path}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Main Content */}
              <div className="lg:col-span-2">
                {selectedEndpoint ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${getMethodColor(selectedEndpoint.method)} text-white`}>
                          {selectedEndpoint.method}
                        </Badge>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {selectedEndpoint.path}
                        </code>
                      </div>
                      <CardTitle>{selectedEndpoint.summary}</CardTitle>
                      <p className="text-muted-foreground">{selectedEndpoint.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Authentication */}
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Authentication
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={selectedEndpoint.authentication === 'required' ? 'destructive' : 'secondary'}>
                            {selectedEndpoint.authentication}
                          </Badge>
                          {selectedEndpoint.permissions && (
                            <div className="flex gap-1">
                              {selectedEndpoint.permissions.map(perm => (
                                <Badge key={perm} variant="outline" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Parameters */}
                      {selectedEndpoint.parameters && (
                        <div>
                          <h4 className="font-semibold mb-2">Parameters</h4>
                          <div className="space-y-2">
                            {selectedEndpoint.parameters.map(param => (
                              <div key={param.name} className="border rounded p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-sm font-medium">{param.name}</code>
                                  <Badge variant="outline" className="text-xs">{param.type}</Badge>
                                  <Badge variant="outline" className="text-xs">{param.in}</Badge>
                                  {param.required && (
                                    <Badge variant="destructive" className="text-xs">required</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{param.description}</p>
                                {param.example && (
                                  <code className="text-xs bg-muted px-2 py-1 rounded mt-1 block">
                                    Example: {JSON.stringify(param.example)}
                                  </code>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Request Body */}
                      {selectedEndpoint.requestBody && (
                        <div>
                          <h4 className="font-semibold mb-2">Request Body</h4>
                          <div className="border rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{selectedEndpoint.requestBody.contentType}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(JSON.stringify(selectedEndpoint.requestBody.example, null, 2))}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(selectedEndpoint.requestBody.example, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Responses */}
                      <div>
                        <h4 className="font-semibold mb-2">Responses</h4>
                        <div className="space-y-2">
                          {selectedEndpoint.responses.map(response => (
                            <div key={response.status} className="border rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={response.status < 300 ? 'default' : 'destructive'}>
                                    {response.status}
                                  </Badge>
                                  <span className="text-sm">{response.description}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(JSON.stringify(response.example, null, 2))}
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(response.example, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <Book className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Select an API Endpoint</h3>
                        <p className="text-muted-foreground">
                          Choose an endpoint from the list to view its documentation
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  API Testing Console
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Test API endpoints directly from the documentation
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Method</label>
                    <Select value={testRequest.method} onValueChange={(method) => 
                      setTestRequest(prev => ({ ...prev, method }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">URL</label>
                    <Input
                      placeholder="https://api.ceylonexpand.com/api/admin/users"
                      value={testRequest.url}
                      onChange={(e) => setTestRequest(prev => ({ ...prev, url: e.target.value }))}
                      data-testid="input-test-url"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Headers (JSON)</label>
                  <Textarea
                    placeholder='{"Authorization": "Bearer your-token"}'
                    value={testRequest.headers}
                    onChange={(e) => setTestRequest(prev => ({ ...prev, headers: e.target.value }))}
                    rows={3}
                  />
                </div>

                {testRequest.method !== 'GET' && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Request Body (JSON)</label>
                    <Textarea
                      placeholder='{"key": "value"}'
                      value={testRequest.body}
                      onChange={(e) => setTestRequest(prev => ({ ...prev, body: e.target.value }))}
                      rows={5}
                    />
                  </div>
                )}

                <Button onClick={testEndpoint} className="w-full" data-testid="button-test-api">
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="authentication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Authentication Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Authentication Methods</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The HiBowan Admin API uses JWT-based authentication with role-based access control.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border rounded p-4">
                      <h5 className="font-medium mb-2">1. Login to get access token</h5>
                      <code className="text-xs bg-muted p-2 rounded block">
                        POST /api/auth/admin/login<br/>
                        Content-Type: application/json<br/><br/>
                        {JSON.stringify({ email: 'admin@example.com', password: 'password' }, null, 2)}
                      </code>
                    </div>

                    <div className="border rounded p-4">
                      <h5 className="font-medium mb-2">2. Include token in requests</h5>
                      <code className="text-xs bg-muted p-2 rounded block">
                        Authorization: Bearer your-jwt-token
                      </code>
                    </div>

                    <div className="border rounded p-4">
                      <h5 className="font-medium mb-2">3. Required Permissions</h5>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          'user.view', 'user.create', 'user.edit', 'user.delete',
                          'trip.view', 'trip.edit', 'trip.delete',
                          'moderation.view', 'moderation.manage',
                          'audit.view', 'system.admin'
                        ].map(perm => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schemas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Data Schemas
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Common data structures used in the API
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded p-4">
                    <h4 className="font-semibold mb-2">User Schema</h4>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string", 
  "role": "user|moderator|admin|superadmin",
  "status": "active|suspended|banned",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}`}
                    </pre>
                  </div>

                  <div className="border rounded p-4">
                    <h4 className="font-semibold mb-2">Report Schema</h4>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  "id": "string",
  "context": "trip|user|comment",
  "reason": "string",
  "description": "string",
  "status": "open|investigating|resolved",
  "priority": "low|medium|high|critical",
  "severity": "low|medium|high",
  "autoFlagged": "boolean",
  "createdAt": "datetime"
}`}
                    </pre>
                  </div>

                  <div className="border rounded p-4">
                    <h4 className="font-semibold mb-2">AI Analysis Schema</h4>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  "analysis": {
    "toxicity": "number",
    "sentiment": "positive|negative|neutral",
    "riskLevel": "low|medium|high|critical",
    "threats": "boolean",
    "harassment": "boolean",
    "spam": "boolean"
  },
  "decision": {
    "action": "approve|flag|remove|escalate",
    "confidence": "number",
    "reason": "string"
  }
}`}
                    </pre>
                  </div>

                  <div className="border rounded p-4">
                    <h4 className="font-semibold mb-2">Error Schema</h4>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  "message": "string",
  "code": "string",
  "details": "object",
  "timestamp": "datetime"
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}