import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
} from '@chakra-ui/react'
import { useState } from 'react'
import { useCreateObjective } from '../hooks'

interface CreateObjectiveModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateObjectiveModal({
  isOpen,
  onClose,
}: CreateObjectiveModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const toast = useToast()
  const createObjective = useCreateObjective()

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title is required',
        status: 'error',
        duration: 3000,
      })
      return
    }

    try {
      await createObjective.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
      })
      toast({
        title: 'Objective created',
        status: 'success',
        duration: 3000,
      })
      setTitle('')
      setDescription('')
      onClose()
    } catch (error) {
      toast({
        title: 'Failed to create objective',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Objective</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4} isRequired>
            <FormLabel>Title</FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter objective title"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter objective description (optional)"
              rows={4}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={createObjective.isPending}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
