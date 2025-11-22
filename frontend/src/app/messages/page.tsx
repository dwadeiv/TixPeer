'use client';

import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { mockUsers } from '@/utils/mockData';

export default function Messages() {
  // Mock conversations
  const conversations = [
    {
      id: '1',
      user: mockUsers[0],
      lastMessage: "That sounds great! Let's finalize the trade details.",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      unread: true,
      listing: 'Taylor Swift | The Eras Tour',
    },
    {
      id: '2',
      user: mockUsers[1],
      lastMessage: 'Thanks for reaching out! I can meet downtown.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      unread: false,
      listing: 'NBA Finals - Game 3',
    },
    {
      id: '3',
      user: mockUsers[2],
      lastMessage: 'I have the tickets ready. When works for you?',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      unread: false,
      listing: 'Hamilton',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-20 md:pb-8">
      <h1 className="text-3xl mb-6">Messages</h1>

      {conversations.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="size-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600 mb-2">No messages yet</p>
          <p className="text-sm text-slate-500">
            Start chatting with other users to arrange ticket trades
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map(conversation => (
            <Card
              key={conversation.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <Avatar className="size-12">
                  <AvatarImage src={conversation.user.avatar} />
                  <AvatarFallback>{conversation.user.name[0]}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="mb-0.5">{conversation.user.name}</h3>
                      <p className="text-sm text-slate-600">{conversation.listing}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-slate-500">
                        {new Date(conversation.timestamp).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                      {conversation.unread && (
                        <Badge className="bg-purple-600">New</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 truncate">
                    {conversation.lastMessage}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
