# Guia Rápido - Shadcn/ui no DevTools

## 🚀 Como Usar os Componentes

### Button

```tsx
import { Button } from '@/components/ui/button'

// Variantes
<Button variant="default">Primary Action</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Menu Item</Button>
<Button variant="link">Link Style</Button>

// Tamanhos
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><IconTrash /></Button>

// Com ícone
<Button>
  <IconPlus size={16} />
  Add New
</Button>
```

### Card

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>;
```

### Badge

```tsx
import { Badge } from '@/components/ui/badge'

// Status HTTP
<Badge variant="success">200</Badge>  {/* Verde */}
<Badge variant="info">301</Badge>     {/* Azul */}
<Badge variant="warning">404</Badge>  {/* Amarelo */}
<Badge variant="destructive">500</Badge> {/* Vermelho */}

// Outros
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
```

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    <TabsTrigger value="tab3">Tab 3</TabsTrigger>
  </TabsList>

  <TabsContent value="tab1">
    Content for tab 1
  </TabsContent>

  <TabsContent value="tab2">
    Content for tab 2
  </TabsContent>

  <TabsContent value="tab3">
    Content for tab 3
  </TabsContent>
</Tabs>

// Tabs aninhadas (como no RequestDetail)
<Tabs defaultValue="request">
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="request">Request</TabsTrigger>
    <TabsTrigger value="response">Response</TabsTrigger>
  </TabsList>

  <TabsContent value="request">
    <Tabs defaultValue="headers">
      <TabsList>
        <TabsTrigger value="headers">Headers</TabsTrigger>
        <TabsTrigger value="payload">Payload</TabsTrigger>
      </TabsList>
      <TabsContent value="headers">...</TabsContent>
      <TabsContent value="payload">...</TabsContent>
    </Tabs>
  </TabsContent>
</Tabs>
```

### Table

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';

<Table>
  <TableCaption>A list of your recent requests</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Method</TableHead>
      <TableHead>Route</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Duration</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.method}</TableCell>
        <TableCell>{item.route}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
        </TableCell>
        <TableCell className="text-right">{item.duration}ms</TableCell>
      </TableRow>
    ))}
  </TableBody>
  <TableFooter>
    <TableRow>
      <TableCell colSpan={3}>Total</TableCell>
      <TableCell className="text-right">{total}</TableCell>
    </TableRow>
  </TableFooter>
</Table>;
```

### Input

```tsx
import { Input } from '@/components/ui/input'

<Input
  type="text"
  placeholder="Search..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>

<Input
  type="email"
  placeholder="Email"
  disabled
/>

<Input
  type="password"
  placeholder="Password"
/>
```

### Skeleton (Loading)

```tsx
import { Skeleton } from '@/components/ui/skeleton'

// Loading de card
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-32" />
  </CardHeader>
  <CardContent className="space-y-4">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
  </CardContent>
</Card>

// Loading de tabela
<div className="space-y-2">
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-10 w-full" />
</div>

// Loading de lista
<div className="space-y-4">
  {[1, 2, 3].map((i) => (
    <div key={i} className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  ))}
</div>
```

### Alert

```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { IconAlertCircle, IconCheckCircle, IconInfoCircle } from '@tabler/icons-react'

// Success
<Alert variant="success">
  <IconCheckCircle className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>
    Your changes have been saved successfully.
  </AlertDescription>
</Alert>

// Error
<Alert variant="destructive">
  <IconAlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Something went wrong. Please try again.
  </AlertDescription>
</Alert>

// Warning
<Alert variant="warning">
  <IconAlertCircle className="h-4 w-4" />
  <AlertDescription>
    This action cannot be undone.
  </AlertDescription>
</Alert>

// Info
<Alert variant="info">
  <IconInfoCircle className="h-4 w-4" />
  <AlertDescription>
    No data available at the moment.
  </AlertDescription>
</Alert>
```

### Empty State

```tsx
import { EmptyState } from '@/components/ui/empty-state'
import { IconInbox, IconSearch, IconDatabase } from '@tabler/icons-react'

// Tabela vazia
<EmptyState
  icon={<IconInbox size={48} />}
  title="No requests found"
  description="There are no HTTP requests to display. Make some requests to see them here."
/>

// Busca sem resultados
<EmptyState
  icon={<IconSearch size={48} />}
  title="No results found"
  description="Try adjusting your search or filter to find what you're looking for."
  action={<Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}
/>

// Erro de conexão
<EmptyState
  icon={<IconDatabase size={48} />}
  title="Connection Error"
  description="Unable to connect to the backend. Please check if the server is running."
  action={<Button onClick={retry}>Retry</Button>}
/>
```

### Dialog (Modal)

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog'

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Dialog content */}
    </div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Com estado controlado
const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Details</DialogTitle>
    </DialogHeader>
    <div>Content here</div>
  </DialogContent>
</Dialog>
```

### Tooltip

```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Simples
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <IconHelp size={16} />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Click for help</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>

// Múltiplos tooltips
<TooltipProvider>
  <div className="flex gap-2">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
          <IconEdit size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Edit</TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
          <IconTrash size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Delete</TooltipContent>
    </Tooltip>
  </div>
</TooltipProvider>
```

## 🎨 Padrões de Uso

### Loading State Pattern

```tsx
function MyComponent() {
  const { data, isLoading, error } = useQuery(...)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error loading data: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<IconInbox size={48} />}
        title="No data found"
        description="There is no data to display."
      />
    )
  }

  return (
    <Card>
      {/* Render data */}
    </Card>
  )
}
```

### Status Badge Pattern

```tsx
function getStatusVariant(status: number) {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'info';
  if (status >= 400 && status < 500) return 'warning';
  if (status >= 500) return 'destructive';
  return 'default';
}

<Badge variant={getStatusVariant(statusCode)}>{statusCode}</Badge>;
```

### Table with Actions Pattern

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => handleView(item.id)}>
                    <IconEye size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <IconTrash size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

## 💡 Dicas

### 1. Use `cn()` para combinar classes

```tsx
import { cn } from '@/lib/utils';

<Button className={cn('my-custom-class', isActive && 'bg-primary', isDisabled && 'opacity-50')}>
  Click me
</Button>;
```

### 2. Use `asChild` para composição

```tsx
// Transforma o Button em um Link
<Button asChild>
  <Link to="/dashboard">Go to Dashboard</Link>
</Button>
```

### 3. Customize variantes

```tsx
// Adicione suas próprias variantes no arquivo do componente
const buttonVariants = cva('base-classes', {
  variants: {
    variant: {
      // ... variantes existentes
      custom: 'your-custom-classes',
    },
  },
});
```

### 4. Use CSS variables para cores

```tsx
// Em vez de hardcoded colors
<div className="bg-blue-500">...</div>

// Use variáveis do tema
<div className="bg-primary">...</div>
<div className="bg-muted">...</div>
<div className="text-muted-foreground">...</div>
```

## 🎯 Checklist de Migração

Ao migrar uma página, siga este checklist:

- [ ] Substituir `<button>` por `<Button>`
- [ ] Substituir `<div className="card">` por `<Card>`
- [ ] Usar `<Badge>` para status/tags
- [ ] Implementar `<Skeleton>` para loading
- [ ] Usar `<Alert>` para mensagens
- [ ] Implementar `<EmptyState>` para estados vazios
- [ ] Usar `<Tabs>` do Shadcn/ui
- [ ] Adicionar `<Tooltip>` onde necessário
- [ ] Usar `<Dialog>` para modais
- [ ] Aplicar cores do tema (`bg-background`, `text-foreground`, etc.)
- [ ] Testar dark mode
- [ ] Verificar acessibilidade (navegação por teclado)

## 📚 Recursos

- [Shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS Utilities](https://tailwindcss.com/docs/utility-first)

---

**Última atualização**: 27/10/2025
