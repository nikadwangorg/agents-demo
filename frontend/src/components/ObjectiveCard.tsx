import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Progress,
  VStack,
  HStack,
  IconButton,
  Badge,
  Button,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react'
import { FiTrash2, FiPlus, FiEdit } from 'react-icons/fi'
import { useRef, useState } from 'react'
import type { Objective, KeyResult } from '../types'
import { useDeleteObjective, useDeleteKeyResult } from '../hooks'
import { CreateKeyResultModal } from './CreateKeyResultModal'
import { UpdateProgressModal } from './UpdateProgressModal'

interface ObjectiveCardProps {
  objective: Objective
}

export function ObjectiveCard({ objective }: ObjectiveCardProps) {
  const toast = useToast()
  const deleteObjective = useDeleteObjective()
  const deleteKeyResult = useDeleteKeyResult()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'objective' | 'keyResult'
    id: string
    title: string
  } | null>(null)

  const [selectedKeyResult, setSelectedKeyResult] = useState<KeyResult | null>(
    null
  )

  const {
    isOpen: isCreateKROpen,
    onOpen: onCreateKROpen,
    onClose: onCreateKRClose,
  } = useDisclosure()

  const {
    isOpen: isUpdateProgressOpen,
    onOpen: onUpdateProgressOpen,
    onClose: onUpdateProgressClose,
  } = useDisclosure()

  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onDeleteAlertOpen,
    onClose: onDeleteAlertClose,
  } = useDisclosure()

  // Calculate progress
  const calculateProgress = (kr: KeyResult): number => {
    const progress = Math.min((kr.currentValue / kr.targetValue) * 100, 100)
    return Math.round(progress)
  }

  const objectiveProgress =
    objective.keyResults.length > 0
      ? Math.round(
          objective.keyResults.reduce(
            (sum, kr) => sum + calculateProgress(kr),
            0
          ) / objective.keyResults.length
        )
      : 0

  const handleDeleteClick = (
    type: 'objective' | 'keyResult',
    id: string,
    title: string
  ) => {
    setDeleteTarget({ type, id, title })
    onDeleteAlertOpen()
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    try {
      if (deleteTarget.type === 'objective') {
        await deleteObjective.mutateAsync(deleteTarget.id)
        toast({
          title: 'Objective deleted',
          status: 'success',
          duration: 3000,
        })
      } else {
        await deleteKeyResult.mutateAsync(deleteTarget.id)
        toast({
          title: 'Key Result deleted',
          status: 'success',
          duration: 3000,
        })
      }
    } catch (error) {
      toast({
        title: `Failed to delete ${deleteTarget.type}`,
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      })
    } finally {
      onDeleteAlertClose()
      setDeleteTarget(null)
    }
  }

  const handleUpdateProgress = (kr: KeyResult) => {
    setSelectedKeyResult(kr)
    onUpdateProgressOpen()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <HStack justify="space-between" align="start">
            <Box flex="1">
              <Heading size="md" mb={2}>
                {objective.title}
              </Heading>
              {objective.description && (
                <Text color="gray.600" fontSize="sm">
                  {objective.description}
                </Text>
              )}
            </Box>
            <IconButton
              aria-label="Delete objective"
              icon={<FiTrash2 />}
              colorScheme="red"
              variant="ghost"
              size="sm"
              onClick={() =>
                handleDeleteClick('objective', objective.id, objective.title)
              }
            />
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <VStack align="stretch" spacing={4}>
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="medium">
                  Overall Progress
                </Text>
                <Badge colorScheme="blue">{objectiveProgress}%</Badge>
              </HStack>
              <Progress
                value={objectiveProgress}
                colorScheme="blue"
                borderRadius="md"
                size="sm"
              />
            </Box>

            {objective.keyResults.length > 0 && (
              <VStack align="stretch" spacing={3}>
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  Key Results ({objective.keyResults.length})
                </Text>
                {objective.keyResults.map((kr) => {
                  const progress = calculateProgress(kr)
                  return (
                    <Box
                      key={kr.id}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      bg="gray.50"
                    >
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" flex="1">
                          {kr.title}
                        </Text>
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="Update progress"
                            icon={<FiEdit />}
                            size="xs"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => handleUpdateProgress(kr)}
                          />
                          <IconButton
                            aria-label="Delete key result"
                            icon={<FiTrash2 />}
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() =>
                              handleDeleteClick('keyResult', kr.id, kr.title)
                            }
                          />
                        </HStack>
                      </HStack>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="xs" color="gray.600">
                          {kr.currentValue} / {kr.targetValue} {kr.unit}
                        </Text>
                        <Badge
                          colorScheme={progress === 100 ? 'green' : 'blue'}
                          fontSize="xs"
                        >
                          {progress}%
                        </Badge>
                      </HStack>
                      <Progress
                        value={progress}
                        colorScheme={progress === 100 ? 'green' : 'blue'}
                        borderRadius="md"
                        size="sm"
                      />
                    </Box>
                  )
                })}
              </VStack>
            )}

            <Button
              leftIcon={<FiPlus />}
              size="sm"
              variant="outline"
              onClick={onCreateKROpen}
            >
              Add Key Result
            </Button>
          </VStack>
        </CardBody>
      </Card>

      <CreateKeyResultModal
        objectiveId={objective.id}
        isOpen={isCreateKROpen}
        onClose={onCreateKRClose}
      />

      {selectedKeyResult && (
        <UpdateProgressModal
          keyResult={selectedKeyResult}
          isOpen={isUpdateProgressOpen}
          onClose={() => {
            onUpdateProgressClose()
            setSelectedKeyResult(null)
          }}
        />
      )}

      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete {deleteTarget?.type === 'objective' ? 'Objective' : 'Key Result'}
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{deleteTarget?.title}"?
              {deleteTarget?.type === 'objective' &&
                ' This will also delete all associated key results.'}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleConfirmDelete}
                ml={3}
                isLoading={
                  deleteObjective.isPending || deleteKeyResult.isPending
                }
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}
