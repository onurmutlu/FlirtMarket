import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import type { Message } from '../types';

interface InboxPanelProps {
  userId: number;
}

const replySchema = z.object({
  content: z.string().min(1, 'Yanıt boş olamaz').max(1000, 'Yanıt çok uzun'),
});

type ReplyFormData = z.infer<typeof replySchema>;

function MessageCard({ message, onSelect }: { message: Message; onSelect: (message: Message) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-4"
    >
      <Card
        className={`cursor-pointer transition-colors hover:bg-muted/50 ${
          !message.isRead ? 'border-primary' : ''
        }`}
        onClick={() => onSelect(message)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-medium">{message.senderName}</h4>
              <p className="text-sm text-muted-foreground">
                {format(new Date(message.createdAt), 'PPp', { locale: tr })}
              </p>
            </div>
            {!message.isRead && (
              <div className="h-2 w-2 rounded-full bg-primary" />
            )}
          </div>
          <p className="text-sm line-clamp-2">{message.content}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MessageSkeleton() {
  return (
    <div className="mb-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-full mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}

export function InboxPanel({ userId }: InboxPanelProps) {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      content: '',
    },
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['performerMessages', userId, showUnreadOnly],
    queryFn: async () => {
      const response = await fetch(`/api/messages/inbox?unreadOnly=${showUnreadOnly}`);
      if (!response.ok) {
        throw new Error('Mesajlar yüklenirken bir hata oluştu');
      }
      return response.json() as Promise<Message[]>;
    },
  });

  const sendReply = useMutation({
    mutationFn: async (data: ReplyFormData) => {
      if (!selectedMessage) return;
      
      const response = await fetch(`/api/messages/${selectedMessage.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Yanıt gönderilirken bir hata oluştu');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performerMessages'] });
      toast({
        title: 'Başarılı',
        description: 'Yanıtınız gönderildi',
      });
      form.reset();
      setSelectedMessage(null);
    },
    onError: (error) => {
      toast({
        title: 'Hata',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ReplyFormData) => {
    sendReply.mutate(data);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gelen Mesajlar</CardTitle>
        <div className="flex items-center space-x-2">
          <span className="text-sm">Yanıtlanmamışlar</span>
          <Switch
            checked={showUnreadOnly}
            onCheckedChange={setShowUnreadOnly}
          />
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <MessageSkeleton key={i} />)
          ) : messages?.length > 0 ? (
            messages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onSelect={setSelectedMessage}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <p className="text-muted-foreground">Henüz mesajınız yok</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <Dialog open={!!selectedMessage} onOpenChange={() => {
        setSelectedMessage(null);
        form.reset();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mesaj Detayı</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">{selectedMessage?.senderName}</h4>
              <span className="text-xs text-muted-foreground">
                {selectedMessage?.createdAt && format(new Date(selectedMessage.createdAt), 'PPp', { locale: tr })}
              </span>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p>{selectedMessage?.content}</p>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Textarea
                  {...form.register('content')}
                  placeholder="Yanıtınızı yazın..."
                  className="min-h-[100px] resize-none"
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.content.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedMessage(null);
                    form.reset();
                  }}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={sendReply.isPending}
                >
                  {sendReply.isPending ? 'Gönderiliyor...' : 'Yanıtla'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 