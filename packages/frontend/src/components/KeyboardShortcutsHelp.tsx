import { IconKeyboard } from '@tabler/icons-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { KeyboardShortcut, formatShortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
  shortcuts,
}: KeyboardShortcutsHelpProps) {
  // Group shortcuts by category
  const navigationShortcuts = shortcuts.filter((s) => s.description.includes('Navegar'));
  const actionShortcuts = shortcuts.filter((s) => !s.description.includes('Navegar'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconKeyboard size={24} />
            Atalhos de Teclado
          </DialogTitle>
          <DialogDescription>
            Use estes atalhos para navegar mais rapidamente pela aplicação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {navigationShortcuts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Navegação</h3>
              <div className="space-y-2">
                {navigationShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge variant="secondary" className="font-mono">
                      {formatShortcut(shortcut)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {actionShortcuts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Ações</h3>
              <div className="space-y-2">
                {actionShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge variant="secondary" className="font-mono">
                      {formatShortcut(shortcut)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            💡 Dica: Pressione{' '}
            <Badge variant="outline" className="font-mono mx-1">
              ?
            </Badge>{' '}
            a qualquer momento para ver esta lista de atalhos.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
